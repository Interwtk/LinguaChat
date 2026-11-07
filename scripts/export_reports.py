"""Export the project's handoff documents as plain-text copies plus a ZIP.

The owner shares phase reports with other agents (ChatGPT) and could not open
Markdown links pointing inside this clone. This script writes a self-contained
folder under the user's real Windows Downloads directory:

    <Downloads>/LinguaChat-Reportes-ChatGPT/<label>/
        txt/            full .txt copy of every selected document (verbatim)
        md/             the original .md files (inside the ZIP only)
        00-LEEME.txt    what is inside and how to open it
        01-MAESTRO.txt  docs/project/LINGUACHAT-MASTER.md
        02-INFORME-FASE.txt  the current phase report
        99-TODO-EN-UNO.txt   every document concatenated, for a single upload
        MANIFIESTO.csv / MANIFIESTO.txt  name, path, size, SHA-256
        VERIFICACION.txt  result of re-reading everything after writing
        LinguaChat-<label>.zip (split into parts if larger than --max-zip-mb)

Usage (from the repository root):

    python scripts/export_reports.py --label fase3-2026-11-02 \
        --report docs/audits/2026-11-beta-phase3.md

Only documentation is exported: no source tree, no .env, no node_modules. A
secret scan refuses to export a document that looks like it carries a key.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (topic, repository-relative path). Order is the reading order in the bundle.
DOCUMENTS = [
    ("Contrato del repositorio", "CLAUDE.md"),
    ("Contrato del repositorio", "README.md"),
    ("Traspaso entre agentes", "MANUAL_CHATGPT_DEVELOPMENT.md"),
    ("Estado del proyecto", "docs/project/LINGUACHAT-MASTER.md"),
    ("Estado del proyecto", "docs/project/claude-md-multilingual-proposal.md"),
    ("Beta y preparación", "docs/release/2026-11-beta-scope.md"),
    ("Beta y preparación", "docs/release/2026-11-beta-readiness.md"),
    ("Beta y preparación", "docs/release/2026-11-auth-journeys.md"),
    ("Beta y preparación", "docs/release/rc-001-hardening-report.md"),
    ("Arquitectura multidioma", "docs/architecture/multilingual-curriculum.md"),
    ("Arquitectura multidioma", "docs/architecture/supabase-beta-plan.md"),
    ("Arquitectura multidioma", "docs/architecture/preference-sync-hardening.md"),
    ("Arquitectura multidioma", "docs/architecture/premium-practice.md"),
    ("Seguridad", "docs/architecture/tutor-safety-evaluation.md"),
    ("Seguridad", "docs/architecture/authz-review.md"),
    ("Seguridad", "docs/architecture/guided-tutor.md"),
    ("Arquitectura multidioma", "docs/architecture/course-level-identity.md"),
    ("Arquitectura multidioma", "docs/architecture/learner-retention-signal.md"),
    ("Arquitectura multidioma", "docs/architecture/premium-entitlements-design.md"),
    ("Estado del proyecto", "docs/project/claude-md-jwt-proposal.md"),
    ("Inglés y español", "docs/curriculum/option-order-comparison.md"),
    ("Beta y preparación", "docs/release/2026-11-real-validation-needs.md"),
    ("Inglés y español", "docs/curriculum/pre-a1-freeze.md"),
    ("Inglés y español", "docs/curriculum/pre-a1-a1-readiness-matrix.md"),
    ("Inglés y español", "docs/curriculum/a1-readiness-design.md"),
    ("Inglés y español", "docs/curriculum/curriculum-isolation-plan.md"),
    ("Inglés y español", "docs/curriculum/es-pre-a1-review.md"),
    ("Inglés y español", "docs/curriculum/en-a1-readiness-review.md"),
    ("Inglés y español", "docs/curriculum/es-a1-design.md"),
    ("Inglés y español", "docs/curriculum/human-review-plan.md"),
    ("Monetización", "docs/business/monetization-plan.md"),
    ("Monetización", "docs/business/research/2026-11-01-payments-pricing-research.md"),
    ("Monetización", "docs/business/research/2026-11-02-polar-paddle-eligibility.md"),
    ("Monetización", "docs/business/payment-processor-checklist.md"),
    ("Monetización", "docs/business/regional-pricing-policy.md"),
    ("Tributación chilena", "docs/business/chile-tax-and-commercial-compliance.md"),
    ("Tributación chilena", "docs/business/research/2026-11-02-chile-sii-briefing.md"),
    ("Tributación chilena", "docs/business/research/2026-11-03-sii-official-verification.md"),
    ("Ficha para el contador", "docs/business/accountant-handoff.md"),
    ("Privacidad y términos", "docs/legal/privacy-policy-draft.md"),
    ("Privacidad y términos", "docs/legal/terms-draft.md"),
    ("Privacidad y términos", "docs/legal/jurisdiction-matrix.md"),
    ("Privacidad y términos", "docs/legal/research/2026-11-01-regulatory-research.md"),
    ("Menores y seguridad", "docs/legal/age-and-safety-policy.md"),
    ("Copyright", "docs/legal/content-copyright-policy.md"),
    ("PR y despliegue", "docs/audits/2026-10-31-p6-github-integration-readiness.md"),
    ("PR y despliegue", "docs/audits/2026-10-31-pr137-pr135-conflict-review.md"),
    ("PR y despliegue", "docs/audits/2026-10-31-integration-pr-draft.md"),
    ("PR y despliegue", "docs/release/2026-11-pr-procedure.md"),
    ("QA, riesgos y bloqueos", "docs/auth-qa/README.md"),
    ("QA, riesgos y bloqueos", "docs/audits/2026-11-beta-phase2.md"),
    ("QA, riesgos y bloqueos", "docs/audits/2026-11-beta-phase3.md"),
    ("QA, riesgos y bloqueos", "docs/audits/2026-11-beta-phase4.md"),
    ("QA, riesgos y bloqueos", "docs/audits/2026-11-beta-phase5.md"),
]

# Documents whose absence must fail the export (the rest are optional: a
# document a later phase adds is listed above before it exists).
REQUIRED = {
    "CLAUDE.md",
    "docs/project/LINGUACHAT-MASTER.md",
    "docs/release/2026-11-beta-readiness.md",
    "docs/release/2026-11-beta-scope.md",
    "docs/architecture/multilingual-curriculum.md",
    "docs/business/monetization-plan.md",
    "docs/business/chile-tax-and-commercial-compliance.md",
    "docs/business/accountant-handoff.md",
    "docs/legal/privacy-policy-draft.md",
    "docs/legal/terms-draft.md",
    "docs/legal/age-and-safety-policy.md",
    "docs/legal/content-copyright-policy.md",
}

SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)service_role[_a-z]*\s*[=:]\s*\S{20,}"),
    re.compile(r"(?i)(polar|paddle|stripe)_[a-z_]*(secret|token)\s*[=:]\s*\S{12,}"),
]


def downloads_dir() -> Path:
    """The real Downloads folder, which a user may have moved off the profile."""
    if os.name == "nt":
        try:
            import winreg

            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders",
            )
            value, _ = winreg.QueryValueEx(key, "{374DE290-123F-4565-9164-39C4925E467B}")
            path = Path(os.path.expandvars(value))
            if path.is_dir():
                return path
        except OSError:
            pass
    return Path.home() / "Downloads"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", "-c", "core.autocrlf=false", *args],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "desconocido"


def txt_name(rel: str) -> str:
    return rel.replace("/", "__").removesuffix(".md") + ".txt"


def as_txt(text: str) -> bytes:
    # UTF-8 with BOM and CRLF: opens correctly in Notepad and any editor.
    return ("﻿" + text.replace("\r\n", "\n").replace("\n", "\r\n")).encode("utf-8")


def from_txt(data: bytes) -> str:
    return data.decode("utf-8-sig").replace("\r\n", "\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True, help="subfolder name, e.g. fase3-2026-11-02")
    parser.add_argument("--report", required=True, help="current phase report (repo-relative)")
    parser.add_argument("--max-zip-mb", type=float, default=20.0)
    parser.add_argument("--out", help="override the output root (tests)")
    opts = parser.parse_args()

    if not re.fullmatch(r"[A-Za-z0-9._-]+", opts.label):
        print("label must be a plain folder name", file=sys.stderr)
        return 2

    base = Path(opts.out) if opts.out else downloads_dir() / "LinguaChat-Reportes-ChatGPT"
    target = base / opts.label
    if target.exists():
        # The folder is this script's own output for this label: regenerate it.
        shutil.rmtree(target)
    (target / "txt").mkdir(parents=True)

    branch = git("branch", "--show-current")
    commit = git("rev-parse", "--short", "HEAD")
    dirty = git("status", "--porcelain")
    stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M")

    selected, missing, problems = [], [], []
    for topic, rel in DOCUMENTS + [("Informe de la fase", opts.report)]:
        if any(rel == r for _, r, *__ in selected):
            continue
        src = ROOT / rel
        if not src.is_file():
            missing.append(rel)
            continue
        raw = src.read_bytes()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            problems.append(f"{rel}: no es UTF-8")
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                problems.append(f"{rel}: parece contener una credencial ({pattern.pattern})")
        selected.append((topic, rel, raw, text))

    required_missing = sorted((REQUIRED | {opts.report}) & set(missing))
    if required_missing or problems:
        for line in [*(f"falta {r}" for r in required_missing), *problems]:
            print("ERROR:", line, file=sys.stderr)
        return 1

    manifest = []  # (file in bundle, size, sha256, source, source sha256)

    def put(name: str, data: bytes, source: str = "", source_hash: str = "") -> None:
        path = target / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        manifest.append((name, len(data), sha256(data), source, source_hash))

    for _topic, rel, raw, text in selected:
        put(f"txt/{txt_name(rel)}", as_txt(text), rel, sha256(raw))

    by_rel = {rel: text for _t, rel, _r, text in selected}
    put("01-MAESTRO.txt", as_txt(by_rel["docs/project/LINGUACHAT-MASTER.md"]),
        "docs/project/LINGUACHAT-MASTER.md")
    put("02-INFORME-FASE.txt", as_txt(by_rel[opts.report]), opts.report)

    combined = io.StringIO()
    combined.write(f"LinguaChat — todos los documentos de traspaso\n"
                   f"Rama {branch} @ {commit} · generado {stamp}\n\n")
    for topic, rel, _raw, text in selected:
        combined.write(f"\n\n{'=' * 78}\n{topic.upper()} — {rel}\n{'=' * 78}\n\n{text}")
    put("99-TODO-EN-UNO.txt", as_txt(combined.getvalue()))

    index = "\n".join(f"  [{topic}] {rel}\n      -> txt\\{txt_name(rel)}"
                      for topic, rel, _r, _t in selected)
    readme = f"""LinguaChat — paquete de informes para compartir ({opts.label})

Generado: {stamp}
Rama: {branch} @ {commit}{' (con cambios sin commit)' if dirty else ''}
Carpeta: {target}

Cómo abrir:
  1. Explorador de Windows → Descargas → LinguaChat-Reportes-ChatGPT → {opts.label}
     (o pegar la ruta de arriba en la barra de direcciones del Explorador).
  2. Los .txt se abren con doble clic (Bloc de notas).
  3. Para ChatGPT: subir el ZIP, o 99-TODO-EN-UNO.txt si solo admite un archivo.

Archivos clave:
  01-MAESTRO.txt        documento maestro del proyecto (completo)
  02-INFORME-FASE.txt   informe técnico de la fase ({opts.report})
  99-TODO-EN-UNO.txt    todos los documentos en un solo archivo
  MANIFIESTO.csv        nombre, ruta, tamaño y SHA-256 de cada archivo
  VERIFICACION.txt      comprobación posterior (lectura, hashes, ZIP)

Documentos incluidos ({len(selected)}):
{index}

Documentos previstos que aún no existen: {', '.join(missing) or 'ninguno'}

No contiene: código fuente completo, archivos .env, claves, tokens ni node_modules.
Las copias .txt son el texto íntegro de cada .md (tablas y secciones incluidas).
"""
    put("00-LEEME.txt", as_txt(readme))

    # ZIP: the txt bundle plus the original Markdown files.
    zip_base = f"LinguaChat-{opts.label}"
    entries = [(name, (target / name).read_bytes()) for name, *_ in manifest]
    entries += [(f"md/{rel}", raw) for _t, rel, raw, _x in selected]
    limit = int(opts.max_zip_mb * 1024 * 1024)
    parts, current, size = [], [], 0
    for name, data in entries:
        if current and size + len(data) > limit:
            parts.append(current)
            current, size = [], 0
        current.append((name, data))
        size += len(data)
    parts.append(current)
    zip_names = []
    for i, part in enumerate(parts, 1):
        zname = f"{zip_base}.zip" if len(parts) == 1 else f"{zip_base}-parte{i}de{len(parts)}.zip"
        with zipfile.ZipFile(target / zname, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            for name, data in part:
                zf.writestr(name, data)
        zip_names.append(zname)

    def write_manifest() -> list:
        rows = manifest + [(z, (target / z).stat().st_size,
                            sha256((target / z).read_bytes()), "", "") for z in zip_names]
        buf = io.StringIO()
        writer = csv.writer(buf, lineterminator="\n")
        writer.writerow(["archivo", "ruta_windows", "bytes", "sha256", "origen", "sha256_origen"])
        for name, size_, digest, source, shash in rows:
            writer.writerow([name, str(target / name), size_, digest, source, shash])
        (target / "MANIFIESTO.csv").write_bytes(as_txt(buf.getvalue()))
        lines = [f"{name}\n    {target / name}\n    {size_} bytes  sha256 {digest}"
                 + (f"\n    origen {source}" + (f"  sha256 {shash}" if shash else "") if source else "")
                 for name, size_, digest, source, shash in rows]
        (target / "MANIFIESTO.txt").write_bytes(as_txt(
            f"Manifiesto — {opts.label} — {branch} @ {commit}\n\n" + "\n".join(lines) + "\n"))
        return rows

    rows = write_manifest()

    # Verification: re-read everything from disk, not from memory.
    report, failures = [], []
    for name, size_, digest, source, shash in rows:
        data = (target / name).read_bytes()
        ok = len(data) == size_ and sha256(data) == digest
        if ok and name.startswith("txt/"):
            ok = from_txt(data) == (ROOT / source).read_bytes().decode("utf-8").replace("\r\n", "\n")
        report.append(f"{'OK ' if ok else 'ERR'} {name} ({size_} bytes)")
        if not ok:
            failures.append(name)

    extracted = Path(tempfile.mkdtemp(prefix="lc-export-verify-"))
    try:
        seen = set()
        for zname in zip_names:
            with zipfile.ZipFile(target / zname) as zf:
                bad = zf.testzip()
                if bad:
                    failures.append(f"{zname}: entrada dañada {bad}")
                zf.extractall(extracted)
                seen |= set(zf.namelist())
        for name, data in entries:
            if name not in seen or (extracted / name).read_bytes() != data:
                failures.append(f"ZIP: {name} no coincide tras extraer")
        for rel in sorted(REQUIRED | {opts.report}):
            if f"txt/{txt_name(rel)}" not in seen or f"md/{rel}" not in seen:
                failures.append(f"ZIP: falta {rel}")
        report.append(f"ZIP: {len(zip_names)} archivo(s), {len(seen)} entradas, extraídas y comparadas "
                      f"byte a byte con el original")
    finally:
        shutil.rmtree(extracted, ignore_errors=True)

    sample = target / "01-MAESTRO.txt"
    text = from_txt(sample.read_bytes())
    report.append(f"Muestra leída de principio a fin: 01-MAESTRO.txt, {len(text.splitlines())} líneas; "
                  f"primera: {text.splitlines()[0][:70]!r}; última: {text.rstrip().splitlines()[-1][:70]!r}")
    verdict = "VERIFICADO" if not failures else "FALLÓ: " + "; ".join(failures)
    (target / "VERIFICACION.txt").write_bytes(as_txt(
        f"Verificación — {stamp}\n{verdict}\n\n" + "\n".join(report) + "\n"))

    (base / "LEEME-PRIMERO.txt").write_bytes(as_txt(
        f"Última exportación: {opts.label} ({stamp})\nCarpeta: {target}\n"
        f"ZIP: {', '.join(str(target / z) for z in zip_names)}\n"
        "Cada fase crea su propia subcarpeta; las anteriores se conservan.\n"))

    print(f"CARPETA  {target}")
    for z in zip_names:
        print(f"ZIP      {target / z}  ({(target / z).stat().st_size} bytes)")
    print(f"DOCS     {len(selected)} (+4 archivos de índice)  faltan opcionales: {len(missing)}")
    print(f"RESULTADO {verdict}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())

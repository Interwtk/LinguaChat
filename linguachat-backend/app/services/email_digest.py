import os
import smtplib
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage
from html import escape
from typing import Optional, Protocol
from urllib.parse import quote
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.services.email_store import EmailStore


SUPPORTED_LOCALES = {"en", "es", "pt", "fr", "it", "de", "ja", "ar"}

COPY = {
    "en": {
        "subject": "Your LinguaChat practice is ready",
        "hello": "Ready for today's English practice?",
        "cta": "Open LinguaChat and keep the conversation going.",
        "streak": "Current streak: {value} day(s).",
        "xp": "XP recorded in LinguaChat: {value}.",
        "missions": "Missions completed: {value}.",
        "unsubscribe": "Turn off daily email",
    },
    "es": {
        "subject": "Tu práctica de LinguaChat está lista",
        "hello": "¿Listo para practicar inglés hoy?",
        "cta": "Abre LinguaChat y sigue la conversación.",
        "streak": "Racha actual: {value} día(s).",
        "xp": "XP registrado en LinguaChat: {value}.",
        "missions": "Misiones completadas: {value}.",
        "unsubscribe": "Desactivar correo diario",
    },
    "pt": {
        "subject": "Sua prática no LinguaChat está pronta",
        "hello": "Pronto para praticar inglês hoje?",
        "cta": "Abra o LinguaChat e continue a conversa.",
        "streak": "Sequência atual: {value} dia(s).",
        "xp": "XP registrado no LinguaChat: {value}.",
        "missions": "Missões concluídas: {value}.",
        "unsubscribe": "Desativar e-mail diário",
    },
    "fr": {
        "subject": "Votre pratique LinguaChat est prête",
        "hello": "Prêt à pratiquer l’anglais aujourd’hui ?",
        "cta": "Ouvrez LinguaChat et poursuivez la conversation.",
        "streak": "Série actuelle : {value} jour(s).",
        "xp": "XP enregistré dans LinguaChat : {value}.",
        "missions": "Missions terminées : {value}.",
        "unsubscribe": "Désactiver l’e-mail quotidien",
    },
    "it": {
        "subject": "La tua pratica LinguaChat è pronta",
        "hello": "Pronto a praticare inglese oggi?",
        "cta": "Apri LinguaChat e continua la conversazione.",
        "streak": "Serie attuale: {value} giorno/i.",
        "xp": "XP registrati in LinguaChat: {value}.",
        "missions": "Missioni completate: {value}.",
        "unsubscribe": "Disattiva l’email giornaliera",
    },
    "de": {
        "subject": "Deine LinguaChat-Übung ist bereit",
        "hello": "Bereit für deine heutige Englischübung?",
        "cta": "Öffne LinguaChat und setze das Gespräch fort.",
        "streak": "Aktuelle Serie: {value} Tag(e).",
        "xp": "In LinguaChat erfasste XP: {value}.",
        "missions": "Abgeschlossene Missionen: {value}.",
        "unsubscribe": "Tägliche E-Mail deaktivieren",
    },
    "ja": {
        "subject": "今日のLinguaChat練習の準備ができました",
        "hello": "今日も英語を練習しませんか？",
        "cta": "LinguaChatを開いて会話を続けましょう。",
        "streak": "現在の連続日数: {value}日。",
        "xp": "LinguaChatに記録されたXP: {value}。",
        "missions": "完了したミッション: {value}。",
        "unsubscribe": "毎日のメールを停止",
    },
    "ar": {
        "subject": "تدريب LinguaChat اليومي جاهز",
        "hello": "هل أنت مستعد لممارسة الإنجليزية اليوم؟",
        "cta": "افتح LinguaChat وتابع المحادثة.",
        "streak": "سلسلة الأيام الحالية: {value}.",
        "xp": "نقاط XP المسجلة في LinguaChat: {value}.",
        "missions": "المهام المكتملة: {value}.",
        "unsubscribe": "إيقاف البريد اليومي",
    },
}


def normalize_locale(locale: str) -> str:
    base = (locale or "en").strip().lower().split("-")[0].split("_")[0]
    return base if base in SUPPORTED_LOCALES else "en"


def validate_timezone(name: str) -> str:
    try:
        ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError("Unknown IANA timezone") from exc
    return name


@dataclass
class OutboundEmail:
    to: str
    subject: str
    text: str
    html: str


class EmailTransport(Protocol):
    def send(self, message: OutboundEmail) -> None: ...


class MemoryEmailTransport:
    def __init__(self):
        self.messages: list[OutboundEmail] = []

    def send(self, message: OutboundEmail) -> None:
        self.messages.append(message)


class SMTPEmailTransport:
    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "").strip()
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.username = os.getenv("SMTP_USERNAME", "").strip()
        self.password = os.getenv("SMTP_PASSWORD", "")
        self.sender = os.getenv("SMTP_FROM", "").strip()
        self.use_ssl = os.getenv("SMTP_SSL", "false").lower() == "true"
        self.use_starttls = os.getenv("SMTP_STARTTLS", "true").lower() == "true"
        if not self.host or not self.sender:
            raise RuntimeError("SMTP_HOST and SMTP_FROM are required for SMTP email transport")

    def send(self, message: OutboundEmail) -> None:
        email = EmailMessage()
        email["From"] = self.sender
        email["To"] = message.to
        email["Subject"] = message.subject
        email.set_content(message.text)
        email.add_alternative(message.html, subtype="html")
        smtp_cls = smtplib.SMTP_SSL if self.use_ssl else smtplib.SMTP
        with smtp_cls(self.host, self.port, timeout=20) as client:
            if not self.use_ssl and self.use_starttls:
                client.starttls()
            if self.username:
                client.login(self.username, self.password)
            client.send_message(email)


def transport_from_env() -> EmailTransport:
    mode = os.getenv("EMAIL_TRANSPORT", "disabled").strip().lower()
    if mode == "memory":
        return MemoryEmailTransport()
    if mode == "smtp":
        return SMTPEmailTransport()
    raise RuntimeError("Daily email transport is disabled; set EMAIL_TRANSPORT=memory or smtp")


def _progress_lines(progress: Optional[dict], strings: dict[str, str]) -> list[str]:
    if not progress:
        return []
    lines = []
    # Only render fields the client actually supplied. Missing values are never guessed.
    if progress.get("streak") is not None:
        lines.append(strings["streak"].format(value=progress["streak"]))
    if progress.get("xp") is not None:
        lines.append(strings["xp"].format(value=progress["xp"]))
    if progress.get("missions_completed") is not None:
        lines.append(strings["missions"].format(value=progress["missions_completed"]))
    return lines


def build_daily_email(subscription: dict) -> OutboundEmail:
    locale = normalize_locale(subscription.get("locale", "en"))
    strings = COPY[locale]
    progress_lines = _progress_lines(subscription.get("progress"), strings)
    base_url = os.getenv("EMAIL_PUBLIC_BASE_URL", "").rstrip("/")
    unsubscribe_url = ""
    if base_url:
        unsubscribe_url = f"{base_url}/email-digest/unsubscribe/{quote(subscription['unsubscribe_token'], safe='')}"

    text_parts = [strings["hello"], strings["cta"], *progress_lines]
    if unsubscribe_url:
        text_parts.append(f"{strings['unsubscribe']}: {unsubscribe_url}")
    else:
        text_parts.append(strings["unsubscribe"] + ": LinguaChat → You → Daily email")
    text = "\n\n".join(text_parts)

    dir_attr = "rtl" if locale == "ar" else "ltr"
    paragraphs = "".join(f"<p>{escape(line)}</p>" for line in [strings["hello"], strings["cta"], *progress_lines])
    unsubscribe_html = (
        f'<p><a href="{escape(unsubscribe_url)}">{escape(strings["unsubscribe"])}</a></p>'
        if unsubscribe_url
        else f"<p>{escape(strings['unsubscribe'])}: LinguaChat → You → Daily email</p>"
    )
    html = f'<div dir="{dir_attr}" style="font-family:system-ui,sans-serif">{paragraphs}{unsubscribe_html}</div>'
    return OutboundEmail(to=subscription["email"], subject=strings["subject"], text=text, html=html)


def dispatch_due_emails(
    store: EmailStore,
    transport: EmailTransport,
    *,
    now_utc: Optional[datetime] = None,
) -> dict[str, int]:
    now = now_utc or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    result = {"considered": 0, "sent": 0, "skipped": 0, "failed": 0}

    for subscription in store.list_enabled():
        result["considered"] += 1
        try:
            local_now = now.astimezone(ZoneInfo(subscription["timezone"]))
        except (ZoneInfoNotFoundError, ValueError):
            result["failed"] += 1
            continue
        if local_now.hour < int(subscription["preferred_hour"]):
            result["skipped"] += 1
            continue
        local_date = local_now.date().isoformat()
        if not store.claim_send(subscription["subscription_id"], local_date, now):
            result["skipped"] += 1
            continue
        try:
            transport.send(build_daily_email(subscription))
        except Exception:
            store.release_claim(subscription["subscription_id"], local_date)
            result["failed"] += 1
            continue
        store.mark_sent(subscription["subscription_id"], local_date, now)
        result["sent"] += 1

    return result

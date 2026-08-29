# LinguaChat production pause

Paused by explicit owner instruction on 2026-08-29 to stop all LinguaChat automation/cloud consumption while another project is prioritized.

All GitHub Actions workflow files were moved out of `.github/workflows/` into this directory in one atomic commit. Nothing was deleted; restoring production means moving the preserved workflow files back into `.github/workflows/` in a deliberate resume commit.

Do not resume, dispatch, or recreate LinguaChat automation until the owner explicitly asks to resume production.

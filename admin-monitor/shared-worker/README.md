# Private shared AI Assistant

The owner uses `/admin/assistant` on the website and ordinary text in the existing Telegram bot. Both append to the same MongoDB conversation. Existing `/designer`, `/task`, `/status`, printing and other bot commands keep their existing handlers. Photos retain the existing visual-search flow.

Backend variables:

- `OWNER_CHAT_USER_ID`: the exact owner staff-user ID. Other staff, including other admins, cannot read this conversation.
- `OWNER_CHAT_BRIDGE_SECRET`: random secret of at least 32 characters, shared only with the bot service and local worker.

The bot service uses the same `OWNER_CHAT_BRIDGE_SECRET`; its existing private Telegram chat/user restrictions still apply. It posts incoming chat text with stable Telegram chat/message IDs, polls the durable outbox and acknowledges messages only after sending. Telegram delivery may repeat if the bot crashes after Telegram accepts a message but before acknowledgement; command execution remains idempotent.

## PC worker

Install the files in this directory under `C:\ProgramData\KampungCetak\SharedAssistant`, with `settings.json` containing `baseUrl`, `cwd`, `codexExecutable`, `workerPath`, `nodePath`, and `handoffPath`. Protect the bridge secret with Windows `ConvertFrom-SecureString` into `secret.dpapi` under that directory as the signed-in owner. The worker decrypts it in memory and does not pass it to the Codex child process.

Start `start.ps1` hidden. A named mutex prevents duplicate supervisors. It restarts its child after failure. The Windows Startup shortcut launches it after owner sign-in; the PC must be on and connected. Existing Telegram workers are not stopped or replaced.

The worker uses the installed Codex app-server with a persistent conversation ID in `codex-session.json`. Native tools run in a read-only sandbox. The Windows dynamic tool requires owner approval of the exact command through the website or `/approve MESSAGE_ID` / `/decline MESSAGE_ID` in Telegram. Shop-Co tools search current task names and uploaded filenames through the authenticated backend; they never receive database credentials.

One MongoDB room lease serializes all website/Telegram requests across workers. Expired active work is failed, never automatically re-executed. Cancellation interrupts the active Codex turn, but cannot undo earlier side effects. Check state before retrying a print or mutation. Approvals expire with the active job and can only be decided once. Replies use stable parent IDs and cannot be written by a stale lease.

`health.json` records process health. `worker.log` / `worker-error.log` contain connection status without prompts or credentials. The worker writes a readable transcript to the configured `handoffPath`; the owner can also use **Copy for Codex** on the website. This is a supported context handoff, not a claim that a separate existing desktop chat is automatically the same conversation.

Never publish the shared secret or the local DPAPI/recovery files. The website never receives the bridge secret. Do not turn shared chat into a public customer assistant.

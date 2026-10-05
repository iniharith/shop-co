let promptQueue: Promise<unknown> = Promise.resolve();

function confirmDuplicate(originalName: string, suggestedName: string): Promise<boolean> {
  const result = promptQueue.then(() => new Promise<boolean>(resolve => {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', 'Duplicated file');
    dialog.setAttribute('data-upload-confirmation', 'true');
    dialog.style.cssText = 'max-width:480px;width:calc(100% - 32px);padding:24px;border:1px solid #ccc;border-radius:12px;background:white;color:#111;pointer-events:auto;box-shadow:0 20px 60px #0005;';
    const title = document.createElement('h2');
    title.textContent = 'Duplicated file';
    title.style.cssText = 'font-size:20px;font-weight:700;margin-bottom:12px;';
    const message = document.createElement('p');
    message.textContent = `A file named "${originalName}" already exists. Upload this file as "${suggestedName}"?`;
    message.style.cssText = 'overflow-wrap:anywhere;margin-bottom:20px;';
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel upload';
    const rename = document.createElement('button');
    rename.textContent = 'Upload with number';
    for (const button of [cancel, rename]) button.style.cssText = 'padding:10px 16px;border:1px solid #aaa;border-radius:6px;margin:4px;cursor:pointer;';
    rename.style.background = '#111';
    rename.style.color = '#fff';
    const finish = (accepted: boolean) => { dialog.close(); dialog.remove(); resolve(accepted); };
    cancel.onclick = () => finish(false);
    rename.onclick = () => finish(true);
    dialog.oncancel = event => { event.preventDefault(); finish(false); };
    dialog.append(title, message, cancel, rename);
    const host = document.querySelector('[role="dialog"][data-state="open"]') || document.body;
    host.append(dialog);
    dialog.showModal();
    cancel.focus();
  }));
  promptQueue = result.catch(() => {});
  return result;
}

export async function requestUploadUrl(send: (duplicateAction?: string) => Promise<any>): Promise<any> {
  const data = await send();
  if (data?.code !== 'DUPLICATE_FILE') return data;
  if (!await confirmDuplicate(data.originalName, data.suggestedName)) throw new Error('Upload cancelled: duplicated file');
  return send('rename');
}

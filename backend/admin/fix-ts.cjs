const fs = require('fs');

function replaceFile(file, replacer) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = replacer(content);
  if(content !== newContent) fs.writeFileSync(file, newContent);
}

// 1. ChatManager.tsx
replaceFile('src/components/global/chat/ChatManager.tsx', c => {
  c = c.replace(/convData\?\.conversations/g, '(convData as any)?.conversations');
  c = c.replace(/msgData\?\.messages/g, '(msgData as any)?.messages');
  return c;
});

// 2. notifications-drawer.tsx
replaceFile('src/components/global/notifications-drawer.tsx', c => {
  return c.replace(/import \{ INotification \} from [^;]+;/g, '');
});

// 3. TaskModal.tsx
replaceFile('src/components/global/tasks/TaskModal.tsx', c => {
  if (!c.includes('import { Badge } from "@/components/ui/badge"')) {
    c = 'import { Badge } from "@/components/ui/badge";\n' + c;
  }
  c = c.replace(/o\.orderId/g, '(o as any).orderId');
  c = c.replace(/o\.awbUrl/g, '(o as any).awbUrl');
  return c;
});

// 4. tasksManager.tsx
replaceFile('src/components/global/tasks/tasksManager.tsx', c => {
  return c.replace(/tasksData\?\.tasks/g, '(tasksData as any)?.tasks');
});

// 5. ManualOrderModal.tsx
replaceFile('src/components/table/orders/ManualOrderModal.tsx', c => {
  return c.replace(/productsData\?\.products/g, '(productsData as any)?.products');
});

// 6. OrderCard.tsx
replaceFile('src/components/table/orders/OrderCard.tsx', c => {
  return c.replace(/setStatus\(newStatus\);/g, 'setStatus(newStatus as any);');
});

// 7. useNotification.ts
replaceFile('src/hooks/useNotification.ts', c => {
  return c.replace(/, INotificationResponse/g, '');
});

console.log("Done");

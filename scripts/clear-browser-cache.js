// Script to force React Query cache invalidation
// Run this in the browser console to clear all cached WhatsApp data

// Option 1: Clear all React Query cache
localStorage.clear();
sessionStorage.clear();
location.reload(true);

// Option 2: If using React Query DevTools, you can also:
// 1. Open React Query DevTools (bottom right icon)
// 2. Click "Invalidate All"
// 3. Or click on "whatsapp_messages" query and click "Invalidate"

console.log("Cache cleared! Page will reload...");

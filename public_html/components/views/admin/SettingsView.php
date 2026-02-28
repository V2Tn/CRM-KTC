<div class="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[800px] mx-auto pb-20">
    <div class="mb-10 px-1">
        <h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Cấu hình hệ thống</h2>
    </div>

    <div class="bg-white rounded-[40px] p-8 md:p-10 border border-slate-50 shadow-2xl shadow-slate-100/50">
        <div class="space-y-10">
            <div class="space-y-4">
                <h3 class="font-black text-slate-900 text-lg uppercase tracking-tight">Hệ thống Webhook URL</h3>
                <input type="text" id="webhook-url" placeholder="Nhập URL Make.com..." class="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 shadow-sm">
            </div>

            <button onclick="saveSettings()" class="w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:bg-indigo-700">
                <i data-lucide="save" width="18"></i> LƯU CẤU HÌNH
            </button>
        </div>
    </div>
</div>

<script>
// Load settings từ LocalStorage khi vào trang
document.getElementById('webhook-url').value = localStorage.getItem('system_make_webhook_url') || '';

function saveSettings() {
    const url = document.getElementById('webhook-url').value;
    localStorage.setItem('system_make_webhook_url', url);
    alert('Đã lưu cấu hình!');
}
</script>
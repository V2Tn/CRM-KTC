<div class="max-w-[1400px] mx-auto pb-20 px-4 md:px-6 font-['Lexend'] animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
            <div class="flex items-center gap-3 mb-2">
                <div class="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
                <h2 class="text-3xl font-[900] text-slate-800 uppercase tracking-tight">Sơ đồ tổ chức</h2>
            </div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-5">Quản lý phòng ban & bộ phận</p>
        </div>
        
        <div class="flex items-center gap-3">
            <button id="btn-add-dept" onclick="DepartmentController.openDeptModal()" class="flex items-center gap-2 bg-[#5b61f1] hover:bg-[#4f46e5] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all active:scale-95">
                <i data-lucide="plus" width="18" stroke-width="3"></i> <span>Thêm phòng ban</span>
            </button>
        </div>
    </div>

    <div id="department-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div class="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 opacity-50">
            <i data-lucide="loader-2" width="40" class="animate-spin mb-4"></i>
            <span class="font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu...</span>
        </div>
    </div>
</div>
<?php include 'DepartmentDetailModal.php'; ?>
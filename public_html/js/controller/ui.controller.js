/**
 * js/controller/ui.controller.js
 */

// 1. Hàm render toàn bộ danh sách task vào 4 ô ma trận
window.renderTasksGlobal = function (tasks, staffList = []) {
    // Reset nội dung, bộ đếm và cấu hình thanh cuộn cho 4 ô
    const quadrants = ['do_first', 'schedule', 'delegate', 'eliminate'];

    quadrants.forEach(q => {
        const el = document.getElementById(`list-${q}`);
        if (el) {
            el.innerHTML = '';
            // Giới hạn chiều cao hiển thị ~5 task (khoảng 550px) và cho phép cuộn
            el.className = "p-4 flex-1 overflow-y-auto scrollbar-hide space-y-3 max-h-[550px]";

            // Gán sự kiện drop chuẩn xác
            el.ondragover = (e) => e.preventDefault();
            el.ondrop = (e) => {
                if (window.TaskController) {
                    window.TaskController.handleDrop(e, q);
                }
            };
        }
        const c = document.getElementById(`count-${q}`);
        if (c) c.innerText = '0';
    });

    // Phân loại task dựa trên newQuadrant hoặc quadrant
    if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
            const currentQuadrant = task.newQuadrant || task.quadrant || 'do_first';
            const container = document.getElementById(`list-${currentQuadrant}`);
            const counter = document.getElementById(`count-${currentQuadrant}`);

            if (counter) {
                counter.innerText = parseInt(counter.innerText) + 1;
            }

            if (container) {
                container.insertAdjacentHTML('beforeend', createTaskHTML(task, staffList));
            }
        });
    }

    // Render List View (Nếu có container)
    const listViewContainer = document.getElementById('list-view-container');
    const listViewCount = document.getElementById('list-view-count');
    if (listViewContainer) {
        listViewContainer.innerHTML = '';
        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                listViewContainer.insertAdjacentHTML('beforeend', createTaskListHTML(task));
            });
            if (listViewCount) listViewCount.innerText = `${tasks.length} CÔNG VIỆC`;
        } else {
            listViewContainer.innerHTML = `<div class="py-24 text-center opacity-30 font-black uppercase text-xs border-2 border-dashed border-slate-100 rounded-[32px]">Trống dữ liệu công việc</div>`;
        }
    }

    // Khởi tạo icon và sự kiện bổ trợ
    if (window.lucide) lucide.createIcons();

    if (window.TaskController && typeof window.TaskController.initDragAndDrop === 'function') {
        window.TaskController.initDragAndDrop();
    }
    
    // Cập nhật tiến độ
    if (typeof window.updateTodayProgress === 'function') {
        window.updateTodayProgress(tasks);
    }
};

// Hàm cập nhật tiến độ (Progress Circle)
window.updateTodayProgress = function (tasks) {
    let stats = { done: 0, doing: 0, overdue: 0, new: 0, cancel: 0, total: tasks.length };
    tasks.forEach(t => {
        const status = parseInt(t.status);
        if (status === 3) stats.done++;
        else if (status === 2) stats.doing++;
        else if (status === 1) stats.new++;
        else if (status === 4 || status === 0) stats.cancel++;
        if (t.isOverdue == 1 && status !== 3 && status !== 4) stats.overdue++;
    });

    // Update UI Stats
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setVal('stat-done-count', stats.done);
    setVal('stat-doing-count', stats.doing);
    setVal('stat-overdue-count', stats.overdue);
    setVal('stat-new-count', stats.new);
    setVal('stat-cancel-count', stats.cancel);

    const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    const txt = document.getElementById('progress-percent-text');
    const circle = document.getElementById('progress-circle-svg');
    if (txt) txt.innerText = percent + '%';
    if (circle) {
        const circumference = 283;
        circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
        circle.style.opacity = percent === 0 ? "0" : "1";
    }
};

// 2. Logic chuyển đổi giao diện (List <-> Matrix)
window.UIController = {
    switchViewMode: function () {
        const matrixWrapper = document.getElementById('matrix-view-wrapper');
        const listWrapper = document.getElementById('list-view-wrapper');
        const icon = document.getElementById('view-mode-icon');

        if (!matrixWrapper || !listWrapper) return;

        if (listWrapper.classList.contains('hidden')) {
            matrixWrapper.classList.add('hidden');
            listWrapper.classList.remove('hidden');
            if (icon) icon.setAttribute('data-lucide', 'layout');
        } else {
            listWrapper.classList.add('hidden');
            matrixWrapper.classList.remove('hidden');
            if (icon) icon.setAttribute('data-lucide', 'list');
        }
        if (window.lucide) lucide.createIcons();
    }
};

// Helper format ngày giờ
function fmt(d) {
    if (!d) return '--/--';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '--/--' : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
function fmtTime(d) {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Helper lấy tên người dùng
function getUserLabels(task) {
    const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
    const currentUserId = Number(currentUser.id || 0);
    return {
        creator: (Number(task.createdById) === currentUserId) ? 'Tôi' : (task.createdByLabel || 'System'),
        assignee: (Number(task.assigneeId) === currentUserId) ? 'Tôi' : (task.assigneeLabel || 'NV')
    };
}

// 4. HTML VIEW DANH SÁCH (List)
function createTaskListHTML(task) {
    const statusId = parseInt(task.status);
    const { creator, assignee } = getUserLabels(task);
    
    const stateMap = {
        1: { label: 'MỚI', class: 'bg-blue-500 text-white' },
        2: { label: 'ĐANG LÀM', class: 'bg-indigo-500 text-white animate-pulse' },
        3: { label: 'HOÀN THÀNH', class: 'bg-emerald-500 text-white' },
        4: { label: 'HỦY', class: 'bg-slate-400 text-white' }
    };
    const st = stateMap[statusId] || stateMap[1];
    const isFinished = (statusId == 3 || statusId == 4);

    const btnBase = "w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 border shadow-sm";
    let btns = '';
    if (!isFinished) {
        btns += `<button onclick="TaskController.updateStatus(${task.id}, 2)" class="${btnBase} bg-white text-slate-400 hover:text-indigo-600 border-slate-100"><i data-lucide="play" width="14"></i></button>`;
        btns += `<button onclick="TaskController.updateStatus(${task.id}, 3)" class="${btnBase} bg-white text-slate-400 hover:text-emerald-600 border-slate-100 mx-1"><i data-lucide="check" width="16"></i></button>`;
        btns += `<button onclick="TaskController.updateStatus(${task.id}, 4)" class="${btnBase} bg-white text-slate-400 hover:text-rose-600 border-slate-100"><i data-lucide="x" width="16"></i></button>`;
    } else {
        btns += `<button onclick="TaskController.updateStatus(${task.id}, 1)" class="${btnBase} bg-amber-50 text-amber-600 border-amber-100"><i data-lucide="rotate-ccw" width="14"></i></button>`;
    }

    return `
    <div class="bg-white rounded-[24px] p-5 border border-slate-50 shadow-sm hover:shadow-md transition-all flex items-center justify-between group mb-3">
        <div class="flex-1 min-w-0 pr-6">
            <div class="flex items-center gap-3 mb-2">
                <h4 class="text-sm font-[900] text-slate-800 truncate uppercase ${isFinished ? 'line-through opacity-50' : ''}">${task.title}</h4>
                ${task.isOverdue == 1 && !isFinished ? '<span class="bg-rose-500 text-white px-2 py-0.5 rounded-md text-[9px] font-black animate-pulse uppercase whitespace-nowrap">Trễ hạn</span>' : ''}
            </div>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold text-slate-400">
                <div class="flex items-center gap-1.5"><i data-lucide="calendar-plus" width="12" class="text-indigo-400"></i> ${fmt(task.startTime)}</div>
                <div class="flex items-center gap-1.5"><i data-lucide="calendar-off" width="12" class="text-rose-400"></i> ${fmt(task.endTime)}</div>
                <div class="flex items-center gap-2 pl-4 border-l border-slate-100">
                    <span class="text-slate-500"><i data-lucide="user" width="10" class="inline mb-0.5"></i> ${creator}</span>
                    <i data-lucide="arrow-right" width="10" class="text-slate-300"></i>
                    <span class="text-indigo-600 font-black">${assignee}</span>
                </div>
                <span class="px-2 py-0.5 rounded-lg ${st.class} text-[9px] uppercase tracking-wider ml-auto">${st.label}</span>
            </div>
        </div>
        <div class="flex items-center shrink-0 border-l border-slate-50 pl-4 gap-1">${btns}</div>
    </div>`;
}

// 5. HTML VIEW MA TRẬN (Thẻ vuông) - [ĐÃ XÓA TRUNCATE]
function createTaskHTML(task, staffList) {
    const taskId = task.id;
    const statusId = parseInt(task.status);
    const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
    const currentUserId = Number(currentUser.id || 0);

    // Cấu hình nhãn trạng thái
    const stateConfig = {
        1: { label: 'MỚI', class: 'bg-blue-500 text-white border-transparent' },
        2: { label: 'ĐANG LÀM', class: 'bg-indigo-500 text-white border-transparent animate-pulse' },
        3: { label: 'HOÀN THÀNH', class: 'bg-emerald-500 text-white border-transparent' },
        4: { label: 'HỦY', class: 'bg-slate-400 text-white border-transparent' }
    };
    const currentState = stateConfig[statusId] || stateConfig[1];

    const isFinished = (statusId == 3 || statusId == 4);
    const textStyle = isFinished ? 'line-through text-slate-400' : 'text-slate-800';
    const cardOpacity = isFinished ? 'opacity-70 bg-slate-50' : 'bg-white hover:shadow-lg';

    const startTimeStr = task.startTime ? `${fmtTime(task.startTime)} ${fmt(task.startTime)}` : fmt(task.createdAt);

    // Xử lý nhãn Người giao/Người nhận
    const cID = Number(task.createdById);
    const aID = Number(task.assigneeId);
    let creatorLabel = (cID === currentUserId) ? 'TÔI' : (task.createdByLabel || 'System');
    let assigneeLabel = (aID === currentUserId) ? 'TÔI' : (task.assigneeLabel || 'NV');

    if (assigneeLabel === 'NV' && staffList && staffList.length) {
        const staff = staffList.find(s => s.id == aID);
        if (staff) assigneeLabel = staff.fullName;
    }

    // Xử lý các nút bấm hành động
    let buttons = '';
    const btnClass = "w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 shadow-sm";

    if (statusId == 1) {
        buttons += `<button onclick="TaskController.updateStatus(${taskId}, 2)" class="${btnClass} bg-indigo-50 text-indigo-600 hover:bg-indigo-100" title="Bắt đầu"><i data-lucide="play" width="14"></i></button>`;
        buttons += `<button onclick="TaskController.updateStatus(${taskId}, 3)" class="${btnClass} bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Xong"><i data-lucide="check" width="16"></i></button>`;
        buttons += `<button onclick="TaskController.updateStatus(${taskId}, 4)" class="${btnClass} bg-rose-50 text-rose-500 hover:bg-rose-100" title="Hủy"><i data-lucide="x" width="16"></i></button>`;
    } else if (statusId == 2) {
        buttons += `<button onclick="TaskController.updateStatus(${taskId}, 3)" class="${btnClass} bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Xong"><i data-lucide="check" width="16"></i></button>`;
        buttons += `<button onclick="TaskController.updateStatus(${taskId}, 4)" class="${btnClass} bg-rose-50 text-rose-500 hover:bg-rose-100" title="Hủy"><i data-lucide="x" width="16"></i></button>`;
    } else {
        buttons += `<button onclick="TaskController.updateStatus(${taskId}, 1)" class="${btnClass} bg-amber-50 text-amber-600 hover:bg-amber-100" title="Làm lại"><i data-lucide="rotate-ccw" width="14"></i></button>`;
    }

    return `
    <div id="task-card-${taskId}" 
         class="group relative border rounded-[24px] p-5 transition-all duration-300 mb-4 border-slate-100 shadow-sm ${cardOpacity} cursor-grab active:cursor-grabbing" 
         draggable="${!isFinished}" 
         ondragstart="TaskController.handleDragStart(event, ${taskId})">
        
        <div class="flex justify-between items-start gap-3 mb-3">
            <div id="view-mode-${taskId}" class="w-full flex justify-between items-start">
                <h4 class="text-[15px] leading-snug font-[900] ${textStyle} flex-1 pr-2">${task.title}</h4>
                ${!isFinished ? `<button onclick="TaskController.enableEditMode(${taskId})" class="text-slate-300 hover:text-indigo-600 p-1 -mr-2"><i data-lucide="pencil" width="14"></i></button>` : ''}
            </div>
            <div id="edit-mode-${taskId}" class="hidden w-full flex items-center gap-2">
                <input type="text" id="input-title-${taskId}" value="${task.title}" class="w-full text-sm font-bold text-slate-800 border-b-2 border-indigo-500 pb-1 outline-none bg-transparent" onkeydown="if(event.key==='Enter') TaskController.saveTitle(${taskId})">
                <button onclick="TaskController.saveTitle(${taskId})" class="text-indigo-600"><i data-lucide="check" width="16"></i></button>
                <button onclick="TaskController.cancelEdit(${taskId})" class="text-rose-500"><i data-lucide="x" width="16"></i></button>
            </div>
        </div>

        <div class="space-y-1.5 mb-4">
            ${task.endTime ? `
            <div class="flex items-center gap-2 text-[11px] font-[800] uppercase tracking-wide ${task.isOverdue == 1 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}">
                <i data-lucide="calendar" width="12"></i>
                <span class="${task.isOverdue == 1 ? 'text-rose-700' : 'text-rose-600'}">HẠN: ${fmtTime(task.endTime)} ${fmt(task.endTime)}</span>
            </div>` : ''}
            <div class="flex items-center gap-2 text-[11px] font-[800] uppercase tracking-wide text-slate-400">
                <i data-lucide="clock" width="12"></i>
                <span>BẮT ĐẦU: <span class="text-slate-500">${startTimeStr}</span></span>
            </div>
        </div>

        <div class="flex items-center justify-between mt-auto">
            <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-xl text-[10px] font-[900] uppercase tracking-wider ${currentState.class}">${currentState.label}</span>
                
                <div class="bg-[#f8fafc] rounded-xl px-3 py-1.5 flex items-center gap-2 border border-slate-100">
                    <span class="text-[10px] font-[900] text-slate-500" title="${creatorLabel}">${creatorLabel}</span>
                    <i data-lucide="arrow-right" width="10" class="text-slate-300"></i>
                    <span class="text-[10px] font-[900] text-indigo-600" title="${assigneeLabel}">${assigneeLabel}</span>
                </div>

                ${task.isOverdue == 1 ? `<span class="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-[900] uppercase tracking-wider shadow-sm shadow-rose-200">TRỄ HẠN</span>` : ''}
            </div>
            <div class="flex items-center gap-2">${buttons}</div>
        </div>
    </div>`;
}

// ==========================================
// GLOBAL DROPDOWN HANDLERS (Dùng chung cho toàn hệ thống)
// ==========================================
window.toggleCustomDropdown = function(id) {
    const el = document.getElementById(id);
    // Đóng các dropdown khác đang mở
    document.querySelectorAll('.custom-dropdown-menu').forEach(d => {
        if (d.id !== id) d.classList.add('hidden');
    });

    if (el) {
        el.classList.toggle('hidden');
        const icon = el.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) icon.style.transform = el.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
};

window.selectCustomDropdown = function(prefix, value, label, callbackStr = null) {
    const labelEl = document.getElementById(`${prefix}-label`);
    const inputEl = document.getElementById(`${prefix}-hidden`);
    const dropdown = document.getElementById(`${prefix}-dropdown`);

    if (labelEl) labelEl.innerText = label;
    if (inputEl) inputEl.value = value;
    
    if (dropdown) {
        dropdown.classList.add('hidden');
        const icon = dropdown.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    // Chạy hàm callback nếu có
    if (callbackStr) eval(callbackStr);
};

// Click ra ngoài thì tự đóng Dropdown
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown-container')) {
        document.querySelectorAll('.custom-dropdown-menu').forEach(d => {
            d.classList.add('hidden');
            const icon = d.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
            if (icon) icon.style.transform = 'rotate(0deg)';
        });
    }
});
<?php
/**
 * header.php - Bản thu gọn thanh Menu (Ôm sát nội dung)
 */
$userFullName = $currentUser['fullName'] ?? 'Khách';
$userRole = $currentUser['role'] ?? 'GUEST';
$userRoleDisplay = str_replace('_', ' ', $userRole);

$isHighRole = in_array($userRole, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
$isAdmin = in_array($userRole, ['SUPER_ADMIN', 'ADMIN']);

function getTabClass($id, $activeTab) {
    $base = "flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap snap-start ";
    if ($id === $activeTab) {
        return $base . "bg-indigo-600 text-white shadow-md shadow-indigo-100";
    }
    return $base . "text-slate-400 hover:bg-slate-50 hover:text-indigo-500";
}
?>

<header class="w-full pt-4 pb-2 px-4 md:px-10 font-['Lexend'] relative z-[1000]">
  <div class="max-w-[1440px] mx-auto bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-[28px] p-3">
    
    <div class="flex items-center justify-between gap-4 w-full">
      
      <div class="flex flex-col shrink-0">
        <h1 class="text-lg md:text-xl font-[1000] text-slate-800 tracking-tight leading-tight">
          Xin chào <span id="header-user-name" class="text-indigo-600"><?php echo htmlspecialchars($userFullName); ?></span>
        </h1>
        <div class="flex items-center gap-2 md:gap-3 text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5 whitespace-nowrap">
          <div class="flex items-center gap-1">
            <i data-lucide="calendar" width="10" stroke-width="3"></i>
            <span id="header-date">...</span>
          </div>
          <div class="flex items-center gap-1 border-l border-slate-200 pl-2 md:pl-3">
            <i data-lucide="clock" width="10" stroke-width="3"></i>
            <span id="header-time">...</span>
          </div>
          <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black ml-1"><?php echo $userRoleDisplay; ?></span>
        </div>
      </div>

      <div class="flex-1 min-w-0 px-2 lg:px-6 relative flex items-center justify-center">
          <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          <nav id="main-nav-container" class="flex bg-slate-50/50 p-1 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide snap-x scroll-smooth w-fit max-w-full">
            <div class="flex items-center justify-center gap-1"> 
                <a href="?tab=tasks" class="<?php echo getTabClass('tasks', $activeTab); ?>">
                  <i data-lucide="layout" width="14" stroke-width="3"></i> CÔNG VIỆC
                </a>
                <a href="?tab=reports" class="<?php echo getTabClass('reports', $activeTab); ?>">
                  <i data-lucide="bar-chart-2" width="14" stroke-width="3"></i> BÁO CÁO
                </a>
                <a href="?tab=ranking" class="<?php echo getTabClass('ranking', $activeTab); ?>">
                    <i data-lucide="award" width="16"></i> XẾP HẠNG
                </a>
                <a href="?tab=schedule" class="<?php echo getTabClass('schedule', $activeTab); ?>">
                    <i data-lucide="calendar-check" width="16"></i> HÀNH CHÍNH
                </a>
                <?php if ($isHighRole): ?>
                  <a href="?tab=team" class="<?php echo getTabClass('team', $activeTab); ?>">
                    <i data-lucide="users-2" width="14" stroke-width="3"></i> ĐỘI NHÓM
                  </a>
                <?php endif; ?>
                <?php if ($isHighRole): ?>
                  <a href="?tab=departments" class="<?php echo getTabClass('departments', $activeTab); ?>">
                    <i data-lucide="briefcase" width="14" stroke-width="3"></i> PHÒNG BAN
                  </a>
                <?php endif; ?>
                <?php if ($isAdmin): ?>
                  <a href="?tab=staff" class="<?php echo getTabClass('staff', $activeTab); ?>">
                    <i data-lucide="users" width="14" stroke-width="3"></i> NHÂN VIÊN
                  </a>
                <?php endif; ?>
            </div>
          </nav>
      </div>

      <div class="flex items-center gap-2 relative z-[2000] shrink-0">

        <div class="relative mr-1 md:mr-3">
         <button onclick="NotificationController.toggle()" class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all relative shadow-sm group">
            <i data-lucide="bell" width="20" class="group-hover:animate-swing"></i>
            <span id="noti-badge" class="hidden absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">0</span>
        </button>

        <div id="noti-dropdown" class="hidden absolute top-full right-0 mt-3 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-50 z-[9999] ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
            <div class="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <h4 class="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <i data-lucide="bell-ring" width="14" class="text-indigo-500"></i> Thông báo
                </h4>
                <div class="flex items-center gap-3">
                    <button onclick="NotificationController.markRead()" class="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors">Đọc tất cả</button>
                    <div class="w-px h-3 bg-slate-200"></div>
                    <button onclick="NotificationController.deleteAllRead(event)" class="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors">Xóa đã đọc</button>
                </div>
            </div>
            
            <div id="noti-list" class="max-h-[350px] overflow-y-auto custom-scrollbar p-2 space-y-1"></div>
        </div>
        </div>
        
        <div class="relative">
           <button id="user-menu-btn" onclick="toggleUserMenu(event)" class="h-9 md:h-10 px-2 transition-all rounded-xl border shadow-sm bg-white text-slate-400 border-slate-100 hover:text-indigo-600 flex items-center gap-1 md:gap-2">
                <img 
                    id="header-user-avatar"
                    src="<?php echo !empty($_SESSION['user']['avatar']) ? '/' . ltrim($_SESSION['user']['avatar'], '/') : 'https://ui-avatars.com/api/?name=' . urlencode($userFullName) . '&background=random'; ?>" 
                    alt="Avatar"
                    class="w-6 h-6 md:w-7 md:h-7 rounded-full object-cover border border-slate-200"
                >
                <i data-lucide="chevron-down" width="14" class="hidden md:block"></i>
            </button>

           <div id="user-menu-content" class="hidden absolute top-full right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 z-[5000] ring-1 ring-black/5">
                
                <div onclick="ProfileController.openMyProfile()" class="px-3 py-3 border-b border-slate-50 mb-1 cursor-pointer hover:bg-indigo-50 transition-colors rounded-xl group">
                   <div class="flex items-center justify-between mb-1">
                       <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400">Tài khoản</p>
                       <i data-lucide="edit-3" width="12" class="text-slate-300 group-hover:text-indigo-400"></i>
                   </div>
                   <p id="dropdown-user-name" class="text-xs font-black text-slate-800 truncate group-hover:text-indigo-700"><?php echo htmlspecialchars($userFullName); ?></p>
                </div>
                
                <?php if ($isAdmin): ?>
                <a href="?tab=settings" class="flex items-center justify-between px-3 py-2.5 border-b border-slate-50 mb-1 cursor-pointer hover:bg-indigo-50 transition-colors rounded-xl group">
                   <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600">Cấu hình</span>
                   <i data-lucide="settings" width="14" class="text-slate-400 group-hover:text-indigo-600 stroke-[2.5]"></i>
                </a>
                <?php endif; ?>

                <button onclick="AuthController.logout()" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black text-rose-500 hover:bg-rose-50 transition-all">
                  <span>ĐĂNG XUẤT</span>
                  <i data-lucide="log-out" width="14" stroke-width="3"></i> 
                </button>
           </div>
        </div>
      </div>

    </div>
  </div>
</header>

<script>
function updateClock() {
    const now = new Date();
    const dateEl = document.getElementById('header-date');
    const timeEl = document.getElementById('header-time');
    if(dateEl) dateEl.innerText = `${now.getDate()} THÁNG ${now.getMonth() + 1}, ${now.getFullYear()}`;
    if(timeEl) timeEl.innerText = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock(); 

function toggleUserMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('user-menu-content');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('user-menu-content');
    const btn = document.getElementById('user-menu-btn');
    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        const headerAvatarImg = document.getElementById('header-user-avatar');
        
        if (headerAvatarImg && currentUser.fullName && window.Utils && typeof window.Utils.getAvatar === 'function') {
            headerAvatarImg.src = window.Utils.getAvatar(currentUser.avatar, currentUser.fullName, 128);
        }
    }, 100);
});

const navContainer = document.getElementById('main-nav-container');
if (navContainer) {
    navContainer.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            const maxScrollLeft = navContainer.scrollWidth - navContainer.clientWidth;
            if ((evt.deltaY > 0 && navContainer.scrollLeft < maxScrollLeft) || 
                (evt.deltaY < 0 && navContainer.scrollLeft > 0)) {
                evt.preventDefault();
                navContainer.scrollLeft += evt.deltaY;
            }
        }
    });
}
</script>
<?php
require_once 'db_config.php'; 
$currentUser = $_SESSION['user'] ?? null;

$activeTab = $_GET['tab'] ?? 'tasks'; 
$viewMode = $_GET['view'] ?? 'matrix';
?>

<div id="main-app" class="min-h-screen bg-[#f8fafc] font-['Lexend'] transition-opacity duration-500 opacity-0">
    
    <div id="app-loading" class="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p class="text-xs font-black text-indigo-600 uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
    </div>
    
    <div id="login-view" class="hidden">
        <?php include 'components/views/auth/LoginView.php'; ?>
    </div>

    <div id="dashboard-view" class="hidden pb-20">
        
        <?php include 'components/ui/Header.php'; ?>

        <div class="max-w-[1600px] mx-auto px-4 pt-8 md:pt-12">
            
            <?php if ($activeTab === 'tasks'): ?>
                <div class="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    <div class="w-full lg:w-1/3 flex flex-col gap-6">
                        <?php include 'components/views/tasks/TaskForm.php'; ?>
                        <?php include 'components/ui/StatCard.php'; ?>
                        <?php include 'components/ui/TipsCard.php'; ?>
                    </div>

                    <div class="w-full lg:w-2/3">
                        <div id="matrix-view-wrapper" class="<?php echo ($viewMode === 'matrix') ? '' : 'hidden'; ?>">
                            <?php include 'components/views/dashboard/EisenhowerMatrix.php'; ?>
                        </div>

                        <div id="list-view-wrapper" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 <?php echo ($viewMode === 'list') ? '' : 'hidden'; ?>">
                            <div class="flex items-center justify-between mb-4 px-2">
                                <div class="flex items-center gap-3">
                                    <div class="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
                                    <h3 class="text-xl font-[1000] text-slate-800 uppercase tracking-tight">Tất cả công việc</h3>
                                </div>
                                <span id="list-view-count" class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase shadow-sm border border-indigo-100">0 CÔNG VIỆC</span>
                            </div>
                            
                            <div id="list-view-container" class="flex flex-col gap-4 overflow-y-auto scrollbar-hide max-h-[800px] pb-10">
                                </div>
                        </div>
                    </div>
                </div>

            <?php elseif ($activeTab === 'reports'): ?>
                <div class="animate-in fade-in zoom-in duration-500">
                    <?php include 'components/views/reports/ReportView.php'; ?>
                </div>

            <?php elseif ($activeTab === 'team'): ?>
                <div class="animate-in fade-in slide-in-from-right-4 duration-500">
                    <?php include 'components/views/team/TeamOverview.php'; ?>
                </div>
            
            <?php elseif ($activeTab === 'staff'): ?>
                <div class="animate-in fade-in duration-500">
                    <?php include 'components/views/admin/StaffListView.php'; ?>
                </div>

            <?php elseif ($activeTab === 'departments'): ?>
                <div class="animate-in fade-in duration-500">
                    <?php include 'components/views/admin/DepartmentListView.php'; ?>
                </div>

            <?php elseif ($activeTab === 'settings'): ?>
                <div class="animate-in fade-in duration-500">
                    <?php include 'components/views/admin/SettingsView.php'; ?>
                </div>
            
            <?php elseif ($activeTab === 'ranking'): ?>
                <div class="animate-in fade-in duration-500">
                    <?php include 'components/views/admin/RankingView.php'; ?>
                </div>
                
            <?php elseif ($activeTab === 'schedule'): ?>
                <div class="animate-in fade-in duration-500">
                    <?php include 'components/views/schedule/ScheduleView.php'; ?>
                </div>
               
            <?php else: ?>
                <div class="text-center py-20">
                    <h2 class="text-2xl font-bold text-slate-300">Tab không tồn tại</h2>
                    <a href="?tab=tasks" class="text-indigo-500 hover:underline mt-2 inline-block">Quay về trang chủ</a>
                </div>
            <?php endif; ?>

        </div>
    </div>
</div>

<?php include 'components/ui/CelebrationOverlay.php'; ?>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const isServerSessionActive = <?php echo isset($_SESSION['user']) ? 'true' : 'false'; ?>;
    if (!isServerSessionActive) {
        localStorage.removeItem('current_session_user');
    }
    
    const mainApp = document.getElementById('main-app');
    const loading = document.getElementById('app-loading');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    const sessionUser = JSON.parse(localStorage.getItem('current_session_user'));

    mainApp.classList.remove('opacity-0');

    setTimeout(() => {
        loading.classList.add('hidden'); 
        
        if (!sessionUser || !sessionUser.id) {
            loginView.classList.remove('hidden');
            if (window.location.search) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else {
            dashboardView.classList.remove('hidden');
        }
    }, 300);
});
</script>
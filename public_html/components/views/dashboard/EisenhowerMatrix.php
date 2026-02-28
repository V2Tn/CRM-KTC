<?php
// FILE: components/views/tasks/EisenhowerMatrix.php
require_once __DIR__ . '/../tasks/TaskCard.php';

$QUADRANT_CONFIG = [
    'do_first' => ['title' => 'LÀM NGAY', 'description' => 'QUAN TRỌNG & KHẨN CẤP', 'headerBg' => 'bg-rose-50', 'accentColor' => 'bg-rose-500', 'headerColor' => 'text-rose-600'],
    'schedule' => ['title' => 'LÊN LỊCH', 'description' => 'QUAN TRỌNG & KHÔNG KHẨN CẤP', 'headerBg' => 'bg-sky-50', 'accentColor' => 'bg-sky-500', 'headerColor' => 'text-sky-600'],
    'delegate' => ['title' => 'GIAO VIỆC', 'description' => 'KHÔNG QUAN TRỌNG & KHẨN CẤP', 'headerBg' => 'bg-indigo-50', 'accentColor' => 'bg-indigo-500', 'headerColor' => 'text-indigo-600'],
    'eliminate' => ['title' => 'LOẠI BỎ', 'description' => 'KHÔNG QUAN TRỌNG & KHÔNG KHẨN CẤP', 'headerBg' => 'bg-slate-50', 'accentColor' => 'bg-slate-500', 'headerColor' => 'text-slate-600']
];

if (!isset($tasks)) {
    $uid = $currentUser['id'] ?? 0;
    try {
        $stmt = $pdo->prepare("SELECT * FROM tasks WHERE assigneeId = ? ORDER BY id DESC");
        $stmt->execute([$uid]);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) { $tasks = []; }
}

$matrix = [ 'do_first' => [], 'schedule' => [], 'delegate' => [], 'eliminate' => [] ];
foreach ($tasks as $t) {
    $q = $t['quadrant'] ?? 'do_first';
    if(isset($matrix[$q])) $matrix[$q][] = $t;
    else $matrix['do_first'][] = $t;
}
?>

<style>
    @keyframes jump-shaking {
        0% { transform: translateX(0) }
        25% { transform: translateY(-9px) }
        35% { transform: translateY(-9px) rotate(17deg) }
        55% { transform: translateY(-9px) rotate(-17deg) }
        65% { transform: translateY(-9px) rotate(17deg) }
        75% { transform: translateY(-9px) rotate(-17deg) }
        100% { transform: translateY(0) rotate(0) }
    }
    .animate-jump {
        animation: jump-shaking 0.8s infinite;
    }
</style>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-20 font-['Lexend']">
    <?php foreach ($QUADRANT_CONFIG as $key => $config): ?>
        <div class="flex flex-col h-full min-h-[300px] bg-slate-50/50 rounded-[32px] border border-slate-200/60 overflow-hidden relative group hover:border-indigo-300/30 transition-all duration-300">
            <div class="p-5 flex items-center justify-between <?php echo $config['headerBg']; ?> border-b border-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-8 rounded-full <?php echo $config['accentColor']; ?>"></div>
                    <div>
                        <h3 class="text-sm font-black <?php echo $config['headerColor']; ?> uppercase tracking-wider"><?php echo $config['title']; ?></h3>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5"><?php echo $config['description']; ?></p>
                    </div>
                </div>
                <div id="count-<?php echo $key; ?>" class="px-2.5 py-1 rounded-lg bg-white/60 text-[10px] font-black <?php echo $config['headerColor']; ?> shadow-sm">
                    <?php echo count($matrix[$key]); ?>
                </div>
            </div>

            <div id="list-<?php echo $key; ?>" class="p-4 flex-1 overflow-y-auto scrollbar-hide space-y-3">
                <?php 
                if (empty($matrix[$key])) {
                    echo '<div class="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-widest">Trống</div>';
                } else {
                    foreach ($matrix[$key] as $task) {
                        renderTaskCard($task, $currentUser);
                    }
                }
                ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<div id="celebration-overlay" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-300 opacity-0 pointer-events-none">
    <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"></div>
    
    <div class="relative z-10 bg-white rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 transform scale-50 transition-all duration-500 ease-out" id="celebration-box">
        
        <div class="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 animate-jump relative">
            <i data-lucide="check" class="text-white w-12 h-12 stroke-[4]"></i>
            <div class="absolute -top-2 -right-2 text-3xl animate-pulse">🎉</div>
            <div class="absolute -bottom-2 -left-2 text-3xl animate-pulse delay-75">✨</div>
        </div>
        
        <h2 class="text-3xl font-[900] text-slate-800 mb-2 font-['Lexend'] tracking-tight">Tuyệt vời!</h2>
        <p class="text-slate-500 font-bold text-sm">Chúc mừng bạn đã hoàn thành!</p>
    </div>
</div>
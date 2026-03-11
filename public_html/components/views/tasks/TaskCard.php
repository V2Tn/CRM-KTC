<?php
// FILE: TaskCard.php
function renderTaskCard($task, $currentUser) {
    $taskId = $task['id'];
    $statusId = $task['status'] ?? 1;
    $currentUserId = $currentUser['id'] ?? 0;

    $stateConfig = [
        1 => ['label' => 'MỚI', 'class' => 'bg-blue-500 text-white border-transparent'],
        2 => ['label' => 'ĐANG LÀM', 'class' => 'bg-indigo-500 text-white border-transparent animate-pulse'],
        3 => ['label' => 'HOÀN THÀNH', 'class' => 'bg-emerald-500 text-white border-transparent'],
        4 => ['label' => 'HỦY', 'class' => 'bg-slate-400 text-white border-transparent']
    ];
    $currentState = $stateConfig[$statusId] ?? $stateConfig[1];

    $isFinished = ($statusId == 3 || $statusId == 4);
    $isOverdue = false;
    if (isset($task['isOverdue']) && $task['isOverdue'] == 1) $isOverdue = true;
    elseif (!empty($task['endTime']) && !$isFinished && strtotime($task['endTime']) < time()) $isOverdue = true;

    $creatorLabel = ($task['createdById'] == $currentUserId) ? 'TÔI' : ($task['createdByLabel'] ?? 'System');
    $assigneeLabel = ($task['assigneeId'] == $currentUserId) ? 'TÔI' : ($task['assigneeLabel'] ?? 'NV');
    
    $deadline = !empty($task['endTime']) ? date('H:i d/m', strtotime($task['endTime'])) : '';
    // [FIX] Start Time
    $startTime = !empty($task['startTime']) ? date('H:i d/m', strtotime($task['startTime'])) : date('H:i d/m', strtotime($task['createdAt']));
    
    $cardOpacity = $isFinished ? 'opacity-70 bg-slate-50' : 'bg-white hover:shadow-lg';
    $textStyle = $isFinished ? 'line-through text-slate-400' : 'text-slate-800';
?>
    <div id="task-card-<?php echo $taskId; ?>" class="group relative border rounded-[24px] p-5 transition-all duration-300 mb-4 border-slate-100 shadow-sm <?php echo $cardOpacity; ?>">
        <div class="flex flex-col gap-3">
            <div class="flex justify-between items-start gap-3 mb-3">
                <h4 class="text-[15px] leading-snug font-[900] <?php echo $textStyle; ?> flex-1 pr-2"><?php echo htmlspecialchars($task['title']); ?></h4>
            </div>
            
            <div class="space-y-1.5 mb-4">
                <?php if($deadline): ?>
                <div class="flex items-center gap-2 text-[11px] font-[800] uppercase tracking-wide <?php echo ($isOverdue && !$isFinished) ? 'text-rose-600 animate-pulse' : 'text-slate-400'; ?>">
                    <i data-lucide="calendar" width="12"></i>
                    <span class="<?php echo ($isOverdue && !$isFinished) ? 'text-rose-700' : 'text-rose-600'; ?>">HẠN: <?php echo $deadline; ?></span>
                </div>
                <?php endif; ?>
                <div class="flex items-center gap-2 text-[11px] font-[800] uppercase tracking-wide text-slate-400">
                    <i data-lucide="clock" width="12"></i>
                    <span>BẮT ĐẦU: <?php echo $startTime; ?></span>
                </div>
            </div>

            <div class="flex items-center justify-between mt-auto">
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1.5 rounded-xl text-[10px] font-[900] uppercase tracking-wider <?php echo $currentState['class']; ?>"><?php echo $currentState['label']; ?></span>
                    <div class="bg-[#f8fafc] rounded-xl px-3 py-1.5 flex items-center gap-2 border border-slate-100">
                        <span class="text-[10px] font-[900] text-slate-500"><?php echo $creatorLabel; ?></span>
                        <i data-lucide="arrow-right" width="10" class="text-slate-300"></i>
                        <span class="text-[10px] font-[900] text-indigo-600"><?php echo $assigneeLabel; ?></span>
                    </div>
                    <?php if($isOverdue): ?>
                    <span class="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-[900] uppercase tracking-wider shadow-sm shadow-rose-200">TRỄ HẠN</span>
                    <?php endif; ?>
                </div>
                <div class="flex items-center gap-2"></div>
            </div>
        </div>
    </div>
<?php } ?>
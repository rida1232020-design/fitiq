export const LEVEL_COLORS = {
  beginner: '#22C55E',
  intermediate: '#FF8C00',
  advanced: '#EF4444',
};

const ar = {
  EXERCISES_DB: {
    chest: [
      { id: 'c1', name: 'ضغط بالبار', muscle: 'صدر', equipment: 'بار', sets: 4, reps: '8-12', rest: 90, icon: '🏋️', tips: 'نزّل البار ببطء حتى يلمس صدرك، أبقِ الكتفين ثابتتين', level: 'beginner' },
      { id: 'c2', name: 'ضغط الدمبل', muscle: 'صدر', equipment: 'دمبل', sets: 3, reps: '10-12', rest: 75, icon: '💪', tips: 'وسّع ذراعيك بشكل طبيعي، لا تنزل الدمبل أكثر من اللازم', level: 'beginner' },
      { id: 'c3', name: 'تمرين الفراشة', muscle: 'صدر داخلي', equipment: 'كيبل', sets: 3, reps: '12-15', rest: 60, icon: '🦅', tips: 'ركّز على الإحساس بالعضلة عند الضغط', level: 'intermediate' },
      { id: 'c4', name: 'ضغط الأرض', muscle: 'صدر', equipment: 'بدون', sets: 4, reps: '15-20', rest: 60, icon: '⬆️', tips: 'جسمك مستقيم من الرأس للقدمين', level: 'beginner' },
    ],
    back: [
      { id: 'b1', name: 'سحب البار', muscle: 'ظهر عريض', equipment: 'بار', sets: 4, reps: '8-10', rest: 90, icon: '🔙', tips: 'انحنِ 45 درجة، ظهرك مستقيم دائماً', level: 'advanced' },
      { id: 'b2', name: 'سحب علوي', muscle: 'ظهر عريض', equipment: 'كيبل', sets: 4, reps: '10-12', rest: 75, icon: '⬇️', tips: 'اسحب حتى مستوى الذقن، فعّل عضلة الظهر', level: 'beginner' },
      { id: 'b3', name: 'عقلة', muscle: 'ظهر كامل', equipment: 'بار عقلة', sets: 3, reps: '6-10', rest: 90, icon: '🤸', tips: 'فعّل عضلة الظهر وليس فقط الذراعين', level: 'advanced' },
    ],
    legs: [
      { id: 'l1', name: 'سكوات', muscle: 'فخذ كامل', equipment: 'بار', sets: 4, reps: '8-12', rest: 120, icon: '🦵', tips: 'انزل حتى تتوازى الفخذ مع الأرض', level: 'advanced' },
      { id: 'l2', name: 'ضغط الرجل', muscle: 'فخذ أمامي', equipment: 'جهاز', sets: 4, reps: '12-15', rest: 90, icon: '🦿', tips: 'لا تقفل ركبتيك عند القمة', level: 'beginner' },
      { id: 'l3', name: 'رفعة الساق', muscle: 'فخذ خلفي', equipment: 'جهاز', sets: 3, reps: '12-15', rest: 60, icon: '🔄', tips: 'احبس الحركة ثانية في القمة', level: 'beginner' },
      { id: 'l4', name: 'رفعة الكعب', muscle: 'ساق', equipment: 'جهاز/بدون', sets: 4, reps: '15-20', rest: 45, icon: '👟', tips: 'انزل بالكامل للأسفل للتمدد', level: 'beginner' },
    ],
    shoulders: [
      { id: 's1', name: 'ضغط الكتف', muscle: 'كتف كامل', equipment: 'بار/دمبل', sets: 4, reps: '8-10', rest: 90, icon: '🙆', tips: 'اضغط عمودياً ولا تقوس ظهرك', level: 'intermediate' },
      { id: 's2', name: 'رفع جانبي', muscle: 'كتف جانبي', equipment: 'دمبل', sets: 3, reps: '12-15', rest: 60, icon: '↔️', tips: 'ارفع حتى مستوى الكتف فقط', level: 'beginner' },
      { id: 's3', name: 'رفع أمامي', muscle: 'كتف أمامي', equipment: 'دمبل', sets: 3, reps: '12-15', rest: 60, icon: '☝️', tips: 'تحكم بالحركة صعوداً وهبوطاً', level: 'beginner' },
    ],
    arms: [
      { id: 'a1', name: 'بايسبس كيرل', muscle: 'بايسبس', equipment: 'دمبل/بار', sets: 4, reps: '10-12', rest: 60, icon: '💪', tips: 'لا تتأرجح، الحركة في المرفق فقط', level: 'beginner' },
      { id: 'a2', name: 'ترايسبس داون', muscle: 'ترايسبس', equipment: 'كيبل', sets: 3, reps: '12-15', rest: 60, icon: '⬇️', tips: 'مرفقيك ثابتان بجانب جسمك', level: 'beginner' },
      { id: 'a3', name: 'هامر كيرل', muscle: 'ساعد+بايسبس', equipment: 'دمبل', sets: 3, reps: '12', rest: 60, icon: '🔨', tips: 'المقبض عمودي طوال الحركة', level: 'beginner' },
    ],
    core: [
      { id: 'cr1', name: 'بلانك', muscle: 'بطن كامل', equipment: 'بدون', sets: 3, reps: '45-60ث', rest: 45, icon: '🏂', tips: 'جسمك خط مستقيم، لا ترفع مؤخرتك', level: 'beginner' },
      { id: 'cr2', name: 'كرنش', muscle: 'بطن علوي', equipment: 'بدون', sets: 4, reps: '20', rest: 45, icon: '🌀', tips: 'فقط عضلة البطن تعمل، ليس الرقبة', level: 'beginner' },
      { id: 'cr3', name: 'رفع الرجلين', muscle: 'بطن سفلي', equipment: 'بدون', sets: 3, reps: '15', rest: 45, icon: '🦵', tips: 'نزّل الرجلين ببطء ولا تلمس الأرض', level: 'intermediate' },
    ],
  },
  MUSCLE_GROUPS: [
    { key: 'chest', label: 'الصدر', icon: '🫀' },
    { key: 'back', label: 'الظهر', icon: '🔙' },
    { key: 'legs', label: 'الأرجل', icon: '🦵' },
    { key: 'shoulders', label: 'الكتف', icon: '🙆' },
    { key: 'arms', label: 'الذراعين', icon: '💪' },
    { key: 'core', label: 'البطن', icon: '🌀' },
  ],
  WORKOUT_PLANS: [
    { id: 'p1', name: 'برنامج المبتدئين', level: 'beginner', days: 3, goal: 'بناء أساس قوي', color: '#22C55E', icon: '🌱',
      schedule: [{ day: 'الأحد', focus: 'صدر + ترايسبس', muscles: ['chest', 'arms'] }, { day: 'الثلاثاء', focus: 'ظهر + بايسبس', muscles: ['back', 'arms'] }, { day: 'الخميس', focus: 'أرجل + بطن', muscles: ['legs', 'core'] }] },
    { id: 'p2', name: 'ترقيق وحرق دهون', level: 'intermediate', days: 4, goal: 'حرق دهون + تشكيل', color: '#FF4D00', icon: '🔥',
      schedule: [{ day: 'الأحد', focus: 'صدر + كتف', muscles: ['chest', 'shoulders'] }, { day: 'الاثنين', focus: 'أرجل + بطن', muscles: ['legs', 'core'] }, { day: 'الأربعاء', focus: 'ظهر + بايسبس', muscles: ['back', 'arms'] }, { day: 'الجمعة', focus: 'جسم كامل', muscles: ['chest', 'legs', 'core'] }] },
    { id: 'p3', name: 'بناء العضلات المتقدم', level: 'advanced', days: 5, goal: 'ضخامة وقوة قصوى', color: '#FFB800', icon: '⚡',
      schedule: [{ day: 'الأحد', focus: 'صدر', muscles: ['chest'] }, { day: 'الاثنين', focus: 'ظهر', muscles: ['back'] }, { day: 'الثلاثاء', focus: 'أرجل', muscles: ['legs'] }, { day: 'الخميس', focus: 'كتف + بطن', muscles: ['shoulders', 'core'] }, { day: 'الجمعة', focus: 'ذراعين', muscles: ['arms'] }] },
  ],
  CITIES: ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'النجف', 'كربلاء', 'الناصرية', 'الكوت', 'الرمادي', 'كركوك'],
  DEFAULT_CITY: 'بغداد',
};

const en = {
  EXERCISES_DB: {
    chest: [
      { id: 'c1', name: 'Barbell Bench Press', muscle: 'Chest', equipment: 'Barbell', sets: 4, reps: '8-12', rest: 90, icon: '🏋️', tips: 'Lower the bar slowly to your chest; keep shoulders stable.', level: 'beginner' },
      { id: 'c2', name: 'Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbells', sets: 3, reps: '10-12', rest: 75, icon: '💪', tips: 'Flare elbows naturally; do not over-lower the dumbbells.', level: 'beginner' },
      { id: 'c3', name: 'Cable Fly', muscle: 'Inner chest', equipment: 'Cable', sets: 3, reps: '12-15', rest: 60, icon: '🦅', tips: 'Focus on squeezing the chest at the top.', level: 'intermediate' },
      { id: 'c4', name: 'Push-Up', muscle: 'Chest', equipment: 'Bodyweight', sets: 4, reps: '15-20', rest: 60, icon: '⬆️', tips: 'Keep a straight line from head to heels.', level: 'beginner' },
    ],
    back: [
      { id: 'b1', name: 'Barbell Row', muscle: 'Lats', equipment: 'Barbell', sets: 4, reps: '8-10', rest: 90, icon: '🔙', tips: 'Hinge about 45°; keep your back flat.', level: 'advanced' },
      { id: 'b2', name: 'Lat Pulldown', muscle: 'Lats', equipment: 'Cable', sets: 4, reps: '10-12', rest: 75, icon: '⬇️', tips: 'Pull to chin level; drive with your back.', level: 'beginner' },
      { id: 'b3', name: 'Pull-Up', muscle: 'Full back', equipment: 'Pull-up bar', sets: 3, reps: '6-10', rest: 90, icon: '🤸', tips: 'Engage lats, not just arms.', level: 'advanced' },
    ],
    legs: [
      { id: 'l1', name: 'Squat', muscle: 'Full legs', equipment: 'Barbell', sets: 4, reps: '8-12', rest: 120, icon: '🦵', tips: 'Descend until thighs are parallel to the floor.', level: 'advanced' },
      { id: 'l2', name: 'Leg Press', muscle: 'Quads', equipment: 'Machine', sets: 4, reps: '12-15', rest: 90, icon: '🦿', tips: 'Do not lock knees at the top.', level: 'beginner' },
      { id: 'l3', name: 'Leg Curl', muscle: 'Hamstrings', equipment: 'Machine', sets: 3, reps: '12-15', rest: 60, icon: '🔄', tips: 'Pause one second at peak contraction.', level: 'beginner' },
      { id: 'l4', name: 'Calf Raise', muscle: 'Calves', equipment: 'Machine/Bodyweight', sets: 4, reps: '15-20', rest: 45, icon: '👟', tips: 'Full stretch at the bottom.', level: 'beginner' },
    ],
    shoulders: [
      { id: 's1', name: 'Shoulder Press', muscle: 'Full shoulder', equipment: 'Barbell/Dumbbells', sets: 4, reps: '8-10', rest: 90, icon: '🙆', tips: 'Press vertically; avoid arching your back.', level: 'intermediate' },
      { id: 's2', name: 'Lateral Raise', muscle: 'Side delts', equipment: 'Dumbbells', sets: 3, reps: '12-15', rest: 60, icon: '↔️', tips: 'Raise only to shoulder height.', level: 'beginner' },
      { id: 's3', name: 'Front Raise', muscle: 'Front delts', equipment: 'Dumbbells', sets: 3, reps: '12-15', rest: 60, icon: '☝️', tips: 'Control the weight up and down.', level: 'beginner' },
    ],
    arms: [
      { id: 'a1', name: 'Bicep Curl', muscle: 'Biceps', equipment: 'Dumbbells/Barbell', sets: 4, reps: '10-12', rest: 60, icon: '💪', tips: 'No swinging; move only at the elbow.', level: 'beginner' },
      { id: 'a2', name: 'Tricep Pushdown', muscle: 'Triceps', equipment: 'Cable', sets: 3, reps: '12-15', rest: 60, icon: '⬇️', tips: 'Keep elbows pinned to your sides.', level: 'beginner' },
      { id: 'a3', name: 'Hammer Curl', muscle: 'Forearms + biceps', equipment: 'Dumbbells', sets: 3, reps: '12', rest: 60, icon: '🔨', tips: 'Neutral grip throughout.', level: 'beginner' },
    ],
    core: [
      { id: 'cr1', name: 'Plank', muscle: 'Full core', equipment: 'Bodyweight', sets: 3, reps: '45-60s', rest: 45, icon: '🏂', tips: 'Straight body line; do not hike hips.', level: 'beginner' },
      { id: 'cr2', name: 'Crunch', muscle: 'Upper abs', equipment: 'Bodyweight', sets: 4, reps: '20', rest: 45, icon: '🌀', tips: 'Abs work, not neck strain.', level: 'beginner' },
      { id: 'cr3', name: 'Leg Raise', muscle: 'Lower abs', equipment: 'Bodyweight', sets: 3, reps: '15', rest: 45, icon: '🦵', tips: 'Lower legs slowly without touching the floor.', level: 'intermediate' },
    ],
  },
  MUSCLE_GROUPS: [
    { key: 'chest', label: 'Chest', icon: '🫀' },
    { key: 'back', label: 'Back', icon: '🔙' },
    { key: 'legs', label: 'Legs', icon: '🦵' },
    { key: 'shoulders', label: 'Shoulders', icon: '🙆' },
    { key: 'arms', label: 'Arms', icon: '💪' },
    { key: 'core', label: 'Core', icon: '🌀' },
  ],
  WORKOUT_PLANS: [
    { id: 'p1', name: 'Beginner Program', level: 'beginner', days: 3, goal: 'Build a solid foundation', color: '#22C55E', icon: '🌱',
      schedule: [{ day: 'Sunday', focus: 'Chest + triceps', muscles: ['chest', 'arms'] }, { day: 'Tuesday', focus: 'Back + biceps', muscles: ['back', 'arms'] }, { day: 'Thursday', focus: 'Legs + core', muscles: ['legs', 'core'] }] },
    { id: 'p2', name: 'Fat Loss & Tone', level: 'intermediate', days: 4, goal: 'Burn fat + shape up', color: '#FF4D00', icon: '🔥',
      schedule: [{ day: 'Sunday', focus: 'Chest + shoulders', muscles: ['chest', 'shoulders'] }, { day: 'Monday', focus: 'Legs + core', muscles: ['legs', 'core'] }, { day: 'Wednesday', focus: 'Back + biceps', muscles: ['back', 'arms'] }, { day: 'Friday', focus: 'Full body', muscles: ['chest', 'legs', 'core'] }] },
    { id: 'p3', name: 'Advanced Hypertrophy', level: 'advanced', days: 5, goal: 'Maximum size & strength', color: '#FFB800', icon: '⚡',
      schedule: [{ day: 'Sunday', focus: 'Chest', muscles: ['chest'] }, { day: 'Monday', focus: 'Back', muscles: ['back'] }, { day: 'Tuesday', focus: 'Legs', muscles: ['legs'] }, { day: 'Thursday', focus: 'Shoulders + core', muscles: ['shoulders', 'core'] }, { day: 'Friday', focus: 'Arms', muscles: ['arms'] }] },
  ],
  CITIES: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Nasiriyah', 'Kut', 'Ramadi', 'Kirkuk'],
  DEFAULT_CITY: 'Baghdad',
};

export const exercisesData = { ar, en };

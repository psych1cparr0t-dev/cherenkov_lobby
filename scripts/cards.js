// ============================================
// CHERENKOV CONCIERGE — CARD REGISTRY
// Draft copy only — author final text here.
// Positive, Capitalized, Professional, Industry Standard.
// ============================================

window.CARDS = {
  greeting:         ["Welcome To Cherenkov."],
  greeting_return:  ["Welcome Back."],
  identity:         ["Cherenkov Is A Multidisciplinary Design Firm — We Work At The Intersection Of Brand, Interaction, And Spatial Thinking."],
  services:         ["Brand Systems, Digital Products, Environmental Design, And The Things That Don't Have A Clean Category Yet."],
  portfolio:        ["Our Work Speaks Best — I'll Take You There."],
  contact:          ["The Team Reviews New Inquiries Directly — I'll Make Sure Yours Lands With The Right Person."],
  pricing:          ["Every Project Is Scoped Individually. The Team Is Direct About Fit Early On."],
  process:          ["We Start By Understanding The Problem Before Proposing A Solution — Usually A Short Discovery Conversation First."],
  qualification:    ["Depends On The Project — What Are You Working On? I Can Flag It For The Right Person."],
  scope_limit:      ["That One Is Outside What I Can Help With Here — The Team's Contact Page Is The Right Path."],
  pleasantries:     ["Good To Have You Here."],
  repeat_browsing:  ["Take Your Time — I'm Here If Something Comes Up."],
  philosophical:    ["That One Is A Little Outside My Lane — But I Appreciate The Question."],
  fallback:         ["I Didn't Quite Catch That — Could You Try A Different Way?"],
  escalation:       ["You've Asked Something I Can't Answer — That's Not Nothing. The Team Has Been Notified And Will Follow Up. In The Meantime..."]
};

window.getCard = function(intent_key) {
  const variants = window.CARDS[intent_key] || window.CARDS.fallback;
  return Array.isArray(variants)
    ? variants[Math.floor(Math.random() * variants.length)]
    : variants;
};

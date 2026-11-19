import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudUpload,
  Compass,
  Crown,
  FileCheck2,
  FileText,
  Globe2,
  GraduationCap,
  Heart,
  Languages,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogIn,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UploadCloud,
  WalletCards,
  X,
} from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type { Deadline, MatchTier, ProgramMatch, Scholarship } from "@shared/seed";
import { countries as countryList, deadlines as fallbackDeadlines, programMatches as fallbackMatches, scholarships as fallbackScholarships } from "@shared/seed";
import { copy, normalizeLanguage, textDirection, type Language } from "@shared/i18n";

// The space in the hook import above is not intentional in the starter alias; keep this
// local fallback import for bundlers that normalize aliased paths differently.

const HERO_IMAGE = "/manus-storage/async-images/970YzmPtIsAlIPRESObFd8/image-1.webp";

type ViewKey = "overview" | "matches" | "scholarships" | "deadlines" | "costs" | "comparison" | "assistant" | "profile";

const LanguageContext = createContext<Language>("en");
const useLanguage = () => useContext(LanguageContext);
type ProfileDraft = {
  fullName: string;
  nationality: string;
  residence: string;
  age: string;
  email: string;
  degreeLevel: string;
  fieldOfStudy: string;
  university: string;
  previousCountry: string;
  gpa: string;
  gradingScale: string;
  graduationYear: string;
  languageTest: string;
  languageScore: string;
  annualBudget: string;
  totalBudget: string;
  proofOfFunds: string;
  budgetCurrency: string;
  preferredCountries: string[];
  preferredLanguage: string;
  intake: string;
  studyMode: string;
  scholarshipNeed: string;
  researchExperience: string;
  workExperience: string;
  transcriptFile?: string;
};

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const initialProfile: ProfileDraft = {
  fullName: "Mina Rahimi",
  nationality: "Iran",
  residence: "Tehran",
  age: "24",
  email: "mina.rahimi@example.com",
  degreeLevel: "Bachelor's Degree",
  fieldOfStudy: "Computer Science",
  university: "Sharif University of Technology",
  previousCountry: "Iran",
  gpa: "3.55",
  gradingScale: "4",
  graduationYear: "2025",
  languageTest: "IELTS Academic",
  languageScore: "7.0",
  annualBudget: "18000",
  totalBudget: "32000",
  proofOfFunds: "22000",
  budgetCurrency: "EUR",
  preferredCountries: ["Germany", "Italy", "Netherlands"],
  preferredLanguage: "English",
  intake: "Fall 2027",
  studyMode: "Full-time",
  scholarshipNeed: "Partial funding",
  researchExperience: "Applied ML research assistant, 8 months",
  workExperience: "Frontend developer, 1 year",
};

const navItems: { key: ViewKey; label: string; faLabel: string; icon: Icon }[] = [
  { key: "overview", label: "Overview", faLabel: "نمای کلی", icon: LayoutDashboard },
  { key: "matches", label: "My matches", faLabel: "پیشنهادها", icon: Target },
  { key: "scholarships", label: "Scholarships", faLabel: "بورسیه‌ها", icon: Crown },
  { key: "deadlines", label: "Deadline tracker", faLabel: "تقویم مهلت‌ها", icon: CalendarDays },
  { key: "costs", label: "Cost planner", faLabel: "برنامه هزینه", icon: WalletCards },
  { key: "comparison", label: "Compare", faLabel: "مقایسه", icon: BarChart3 },
  { key: "assistant", label: "Admission assistant", faLabel: "دستیار پذیرش", icon: MessageCircle },
];

const currencies = ["EUR", "USD", "GBP", "CAD", "AUD"];
const exchangeRates: Record<string, number> = { EUR: 1, USD: 1.09, GBP: 0.86, CAD: 1.47, AUD: 1.67 };

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value * (exchangeRates[currency] ?? 1));
}

function tierClass(tier: MatchTier) {
  if (tier === "Safe") return "tier-safe";
  if (tier === "Good match") return "tier-good";
  if (tier === "Ambitious") return "tier-ambitious";
  return "tier-not";
}

function evidenceTone(status: string) {
  return status === "Verified" ? "evidence-verified" : status === "Estimated" ? "evidence-estimated" : "evidence-unconfirmed";
}

function EvidenceChip({ status, lastVerified }: { status: string; lastVerified?: string }) {
  return <span className={cls("evidence-chip", evidenceTone(status))}><span className="evidence-dot" />{status}{lastVerified ? ` · ${lastVerified}` : ""}</span>;
}

function Field({ label, value, onChange, placeholder, type = "text", suffix }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; suffix?: string }) {
  const language = useLanguage();
  const translations: Record<string, string> = { "Full name": "نام کامل", Nationality: "ملیت", "Current country of residence": "کشور محل اقامت", Age: "سن", "Email address": "ایمیل", "Major / field of study": "رشته تحصیلی", "University name": "نام دانشگاه", GPA: "معدل", "Grading scale": "مقیاس نمره", "Graduation year": "سال فارغ‌التحصیلی", "Research experience": "سابقه پژوهشی", "Overall score": "نمره کل", "Preferred study language": "زبان تحصیل", "Test date": "تاریخ آزمون", "Certificate expiry": "تاریخ انقضای مدرک", "Annual tuition budget": "بودجه سالانه شهریه", "Total annual budget": "بودجه کل سالانه", "Proof of funds available": "تمکن مالی موجود", "Language certificate": "مدرک زبان", "Annual budget": "بودجه سالانه", "Preferred intake": "نوبت پذیرش" };
  return <label className="field-wrap"><span className="field-label">{language === "fa" ? translations[label] ?? label : label}</span><span className="field-input-wrap"><input className="field-input" type={type} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />{suffix ? <span className="field-suffix">{suffix}</span> : null}</span></label>;
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action}</div>;
}

function Sidebar({ activeView, onChange, language, onLanguageChange, collapsed, onToggle }: { activeView: ViewKey; onChange: (view: ViewKey) => void; language: Language; onLanguageChange: (language: Language) => void; collapsed: boolean; onToggle: () => void }) {
  return <aside className={cls("sidebar", collapsed && "sidebar-collapsed")}>
    <div className="sidebar-brand"><div className="brand-mark"><Compass size={21} strokeWidth={2.4} /></div>{!collapsed ? <div><div className="brand-name">uniquest<span>.</span></div><div className="brand-caption">GLOBAL ADMISSIONS INTELLIGENCE</div></div> : null}</div>
    <div className="sidebar-section-label">{language === "fa" ? "فضای کاری" : "Workspace"}</div>
    <nav className="sidebar-nav">{navItems.map(item => { const IconComponent = item.icon; return <button key={item.key} className={cls("nav-item", activeView === item.key && "nav-item-active")} onClick={() => onChange(item.key)} title={collapsed ? item.label : undefined}><IconComponent size={18} strokeWidth={activeView === item.key ? 2.4 : 1.8} /><span>{language === "fa" ? item.faLabel : item.label}</span>{activeView === item.key && !collapsed ? <span className="nav-active-line" /> : null}</button>; })}</nav>
    {!collapsed ? <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={16} /><div><strong>{language === "fa" ? "حالت شواهد هوشمند" : "AI evidence mode"}</strong><span>{language === "fa" ? "منابع همیشه قابل مشاهده‌اند." : "Sources stay visible."}</span></div></div><div className="language-switch"><button className={language === "en" ? "active" : ""} onClick={() => onLanguageChange("en")}>EN</button><button className={language === "fa" ? "active" : ""} onClick={() => onLanguageChange("fa")}>FA</button><Languages size={14} /></div><button className="sidebar-collapse" onClick={onToggle}><PanelLeft size={16} />{language === "fa" ? "بستن نوار" : "Collapse rail"}</button></div> : <button className="sidebar-collapse collapsed-toggle" onClick={onToggle}><PanelLeft size={17} /></button>}
  </aside>;
}

function Topbar({ onSearch, onOpenAssessment, user, onLogin, language }: { onSearch: (value: string) => void; onOpenAssessment: () => void; user: { name?: string | null; email?: string | null } | null; onLogin: () => void; language: Language }) {
  const copy = language === "fa" ? { search: "جستجوی رشته، کشور یا بورسیه…", notifications: "اعلان‌ها", signedIn: "وارد شده", guest: "فضای مهمان", reassess: "ارزیابی مجدد پروفایل" } : { search: "Search programs, countries, scholarships…", notifications: "Notifications", signedIn: "Signed in", guest: "Guest workspace", reassess: "Re-assess profile" };
  return <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><Compass size={19} /></div><span>uniquest<span>.</span></span></div><div className="topbar-search"><Search size={17} /><input placeholder={copy.search} onChange={event => onSearch(event.target.value)} /><kbd>⌘ K</kbd></div><div className="topbar-actions"><button className="icon-button subtle" aria-label={copy.notifications}><Bell size={18} /><span className="notification-dot" /></button><button className="header-profile-button" onClick={user ? undefined : onLogin}><span className="avatar">{user?.name?.slice(0, 1) ?? "M"}</span><span className="header-profile-copy"><strong>{user?.name ?? "Mina Rahimi"}</strong><small>{user ? copy.signedIn : copy.guest}</small></span><ChevronRight size={15} /></button><button className="button button-primary button-small" onClick={onOpenAssessment}><Sparkles size={15} />{copy.reassess}</button></div></header>;
}

function StatCard({ label, value, detail, icon: IconComponent, tone = "blue", trend }: { label: string; value: string; detail: string; icon: Icon; tone?: string; trend?: "up" | "down" }) {
  return <div className="stat-card"><div className={cls("stat-icon", `stat-${tone}`)}><IconComponent size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{trend === "up" ? <ArrowUpRight size={12} /> : trend === "down" ? <ArrowDownRight size={12} /> : null}{detail}</small></div></div>;
}

function MatchCard({ match, saved, compared, onSave, onCompare, onOpen }: { match: ProgramMatch; saved: boolean; compared: boolean; onSave: () => void; onCompare: () => void; onOpen: () => void }) {
  const language = useLanguage();
  return <article className="match-card"><div className="match-card-top"><div className="university-avatar">{match.shortName.slice(0, 2)}</div><div className="match-title"><div className="match-university">{match.university}</div><div className="match-location"><span>{match.flag}</span>{match.city}, {match.country}</div></div><button className={cls("icon-button heart-button", saved && "saved")} onClick={onSave} aria-label="Save university"><Heart size={17} fill={saved ? "currentColor" : "none"} /></button></div><div className="match-card-middle"><div className="match-program"><span className="eyebrow">{match.degree} · {match.field}</span><h3>{match.program}</h3><p>{match.reason}</p></div><div className="fit-ring"><strong>{match.fitScore}</strong><span>fit signal</span></div></div><div className="match-meta-row"><span><BookOpen size={14} />{match.duration}</span><span><Globe2 size={14} />{match.language}</span><span><CalendarDays size={14} />{match.deadline}</span></div><div className="match-card-footer"><div className={cls("tier-badge", tierClass(match.tier))}><span />{match.tier}</div><span className="match-cost">{match.tuition}</span><div className="match-actions"><button className="text-button" onClick={onOpen}>{copy(language, "View evidence", "مشاهده شواهد")} <ArrowUpRight size={14} /></button><button className={cls("compare-button", compared && "compare-selected")} onClick={onCompare}>{compared ? <Check size={14} /> : <Plus size={14} />}{compared ? "In compare" : "Compare"}</button></div></div></article>;
}

function Overview({ profile, matches, scholarshipsList, deadlinesList, savedIds, compareIds, onSave, onCompare, onOpenMatch, onOpenAssessment, onView }: { profile: ProfileDraft; matches: ProgramMatch[]; scholarshipsList: Scholarship[]; deadlinesList: Deadline[]; savedIds: string[]; compareIds: string[]; onSave: (id: string) => void; onCompare: (id: string) => void; onOpenMatch: (match: ProgramMatch) => void; onOpenAssessment: () => void; onView: (view: ViewKey) => void }) {
  const language = useLanguage();
  const completion = Math.min(100, Math.round((Object.values(profile).filter(value => Array.isArray(value) ? value.length > 0 : Boolean(value)).length / 24) * 100));
  return <div className="page-stack">
    <div className="welcome-row"><div><div className="eyebrow">{copy(language, "Tuesday, 17 November 2026", "سه‌شنبه، ۱۷ نوامبر ۲۰۲۶")}</div><h1>{copy(language, "Turn your profile into a realistic shortlist.", "پروفایل خود را به یک فهرست واقع‌بینانه تبدیل کنید.")}</h1><p className="page-lede">{copy(language, "Good morning, Mina. Your next best step is to verify two academic details before you apply.", "قدم بعدی شما پیش از ارسال درخواست، بررسی دو جزئیات تحصیلی است.")}</p></div><button className="button button-ghost" onClick={() => onView("profile")}><FileCheck2 size={16} />{copy(language, "Review profile", "بررسی پروفایل")}</button></div>
    <section className="hero-card" style={{ backgroundImage: `linear-gradient(90deg, rgba(15,31,56,.98) 0%, rgba(15,31,56,.88) 37%, rgba(15,31,56,.22) 100%), url(${HERO_IMAGE})` }}><div className="hero-copy"><div className="hero-kicker"><span className="kicker-dot" />{copy(language, "ADMISSIONS INTELLIGENCE BRIEF", "خلاصه هوشمند پذیرش")}</div><h2>{copy(language, "Your shortlist is taking shape.", "فهرست پیشنهادی شما در حال شکل‌گیری است.")}</h2><p>{copy(language, "4 programs fit your current signals. One has a 92/100 fit signal and an open funding path — but every number still needs a source check.", "چهار برنامه با شرایط فعلی شما همخوانی دارند؛ اما هر عدد باید با منبع رسمی بررسی شود.")}</p><div className="hero-actions"><button className="button button-light" onClick={() => onView("matches")}>{copy(language, "Review my matches", "بررسی پیشنهادها")} <ArrowUpRight size={15} /></button><button className="button button-outline-light" onClick={onOpenAssessment}>{copy(language, "Update profile", "به‌روزرسانی پروفایل")}</button></div></div><div className="hero-side-note"><ShieldCheck size={18} /><span>{copy(language, "Indicative assessment only", "ارزیابی تقریبی")}</span><small>{copy(language, "Never a guarantee of admission", "پذیرش هرگز تضمین نمی‌شود")}</small></div></section>
    <div className="stats-grid"><StatCard label="Profile completeness" value={`${completion}%`} detail="+12% this week" icon={CheckCircle2} tone="mint" trend="up" /><StatCard label="Shortlist signals" value="4" detail="2 good matches" icon={Target} tone="blue" /><StatCard label="Scholarship matches" value="3" detail="2 open now" icon={Crown} tone="gold" /><StatCard label="Next deadline" value="59 days" detail="Stipendium Hungaricum" icon={Clock3} tone="coral" /></div>
    <div className="content-grid overview-grid"><section><SectionHeader eyebrow="YOUR SHORTLIST" title="Best next moves" description="Ranked from your academic, language, and budget signals." action={<button className="text-button" onClick={() => onView("matches")}>{copy(language, "See all matches", "مشاهده همه پیشنهادها")} <ArrowUpRight size={14} /></button>} /><div className="match-list">{matches.slice(0, 2).map(match => <MatchCard key={match.id} match={match} saved={savedIds.includes(match.id)} compared={compareIds.includes(match.id)} onSave={() => onSave(match.id)} onCompare={() => onCompare(match.id)} onOpen={() => onOpenMatch(match)} />)}</div></section><aside className="right-rail"><div className="rail-card completion-card"><div className="rail-card-header"><div><div className="eyebrow">{copy(language, "PROFILE SIGNALS", "نشانه‌های پروفایل")}</div><h3>{copy(language, "Ready for better matches?", "برای پیشنهادهای بهتر آماده‌اید؟")}</h3></div><MoreHorizontal size={18} /></div><div className="completion-bar"><span style={{ width: `${completion}%` }} /></div><div className="completion-label"><strong>{completion}% complete</strong><span>{copy(language, "2 actions left", "۲ اقدام باقی مانده")}</span></div><ul className="check-list"><li className="done"><CheckCircle2 size={15} />{copy(language, "Academic profile added", "پروفایل تحصیلی اضافه شد")}</li><li className="done"><CheckCircle2 size={15} />{copy(language, "Language score recorded", "نمره زبان ثبت شد")}</li><li><CircleHelp size={15} />{copy(language, "Verify transcript grading scale", "مقیاس نمرات ریزنمرات را بررسی کنید")}</li><li><CircleHelp size={15} />{copy(language, "Add proof-of-funds range", "محدوده تمکن مالی را اضافه کنید")}</li></ul><button className="button button-secondary full-width" onClick={onOpenAssessment}>{copy(language, "Complete assessment", "تکمیل ارزیابی")} <ChevronRight size={15} /></button></div><div className="rail-card deadline-card"><div className="rail-card-header"><div><div className="eyebrow">{copy(language, "UP NEXT", "قدم بعدی")}</div><h3>{copy(language, "Deadline watch", "پیگیری مهلت‌ها")}</h3></div><button className="text-button" onClick={() => onView("deadlines")}>{copy(language, "View all", "مشاهده همه")}</button></div><div className="deadline-mini-list">{deadlinesList.slice(0, 3).map(item => <div className="deadline-mini" key={item.id}><div className={cls("deadline-date", item.status === "Needs action" && "deadline-date-alert")}><strong>{item.date.split(" ")[0]}</strong><span>{item.date.split(" ")[1]?.slice(0, 3)}</span></div><div><strong>{item.label}</strong><span>{item.daysLeft} days · {item.kind}</span></div><ChevronRight size={15} /></div>)}</div></div></aside></div>
    <section className="bottom-grid"><div className="source-banner"><div className="source-banner-icon"><ShieldCheck size={19} /></div><div><strong>{copy(language, "Evidence stays in the room.", "شواهد همیشه قابل مشاهده‌اند.")}</strong><span>{copy(language, "Every record has a source URL, verification state, and last-checked date. Preview data is linked but some fees remain estimated until a live official connector is enabled.", "هر رکورد منبع، وضعیت راستی‌آزمایی و تاریخ آخرین بررسی دارد. برخی هزینه‌ها تا اتصال منبع رسمی همچنان تقریبی هستند.")}</span></div><button className="text-button" onClick={() => onView("matches")}>{copy(language, "Review evidence", "بررسی شواهد")} <ArrowUpRight size={14} /></button></div><div className="scholarship-strip"><div><div className="eyebrow">{copy(language, "FUNDING RADAR", "رادار تأمین مالی")}</div><h3>{scholarshipsList.filter(item => item.status !== "Closed").length} scholarship paths are worth a look.</h3><p>{copy(language, "Start with Erasmus Mundus and Stipendium Hungaricum.", "از Erasmus Mundus و Stipendium Hungaricum شروع کنید.")}</p></div><button className="button button-secondary" onClick={() => onView("scholarships")}>{copy(language, "Open scholarship finder", "باز کردن جستجوی بورسیه")}</button></div></section>
  </div>;
}

function MatchesView({ matches, savedIds, compareIds, onSave, onCompare, onOpenMatch }: { matches: ProgramMatch[]; savedIds: string[]; compareIds: string[]; onSave: (id: string) => void; onCompare: (id: string) => void; onOpenMatch: (match: ProgramMatch) => void }) {
  const language = useLanguage();
  const [filter, setFilter] = useState<MatchTier | "All">("All");
  const visible = filter === "All" ? matches : matches.filter(match => match.tier === filter);
  return <div className="page-stack"><SectionHeader eyebrow="MATCH ENGINE" title="A shortlist you can explain." description="These are indicative fit signals, not official acceptance probabilities. Filter the evidence, then verify the source before applying." action={<button className="button button-secondary"><SlidersHorizontal size={15} />{copy(language, "Tune signals", "تنظیم معیارها")}</button>} /><div className="filter-row"><div className="filter-pills">{(["All", "Safe", "Good match", "Ambitious", "Not eligible"] as const).map(item => <button key={item} className={filter === item ? "filter-pill active" : "filter-pill"} onClick={() => setFilter(item)}>{item}<span>{item === "All" ? matches.length : matches.filter(match => match.tier === item).length}</span></button>)}</div><span className="filter-note"><Sparkles size={14} />{copy(language, "Rules + evidence model · updated today", "مدل قوانین و شواهد · به‌روزشده امروز")}</span></div><div className="match-list match-list-wide">{visible.map(match => <MatchCard key={match.id} match={match} saved={savedIds.includes(match.id)} compared={compareIds.includes(match.id)} onSave={() => onSave(match.id)} onCompare={() => onCompare(match.id)} onOpen={() => onOpenMatch(match)} />)}</div></div>;
}

function ScholarshipsView({ scholarshipsList, onView }: { scholarshipsList: Scholarship[]; onView: (view: ViewKey) => void }) {
  const language = useLanguage();
  return <div className="page-stack"><SectionHeader eyebrow="FUNDING FINDER" title="Funding with the fine print attached." description="Matched to your degree level, nationality, academic signals, and funding need. Open and upcoming options are shown first." action={<button className="button button-secondary" onClick={() => onView("profile")}><SlidersHorizontal size={15} />{copy(language, "Adjust funding profile", "تنظیم پروفایل مالی")}</button>} /><div className="scholarship-summary"><div><span className="eyebrow">CURRENT RADAR</span><strong>3</strong><span>relevant paths</span></div><div><span className="eyebrow">OPEN NOW</span><strong>2</strong><span>applications to review</span></div><div><span className="eyebrow">COVERAGE</span><strong>€0–€45k</strong><span>depends on award</span></div><div><span className="eyebrow">SOURCE STATUS</span><strong>Verified</strong><span>official program links</span></div></div><div className="scholarship-grid">{scholarshipsList.map(item => <article className="scholarship-card" key={item.id}><div className="scholarship-top"><div className="funder-mark">{item.funder.split(" ").map(word => word[0]).slice(0, 2).join("")}</div><span className={cls("status-pill", item.status === "Open" ? "status-open" : item.status === "Upcoming" ? "status-upcoming" : "status-closed")}>{item.status}</span></div><div className="eyebrow">{item.type} · {item.country}</div><h3>{item.name}</h3><p>{item.funder}</p><div className="scholarship-facts"><div><span>Coverage</span><strong>{item.coverage}</strong></div><div><span>Stipend</span><strong>{item.stipend}</strong></div><div><span>{copy(language, "Deadline", "مهلت")}</span><strong>{item.deadline}</strong></div></div><div className="scholarship-footer"><div className="match-label"><Sparkles size={13} />{item.match}</div><EvidenceChip status={item.evidence.status} lastVerified={item.evidence.lastVerified} /></div><a className="source-link" href={item.officialUrl} target="_blank" rel="noreferrer">{copy(language, "Open official source", "باز کردن منبع رسمی")} <ArrowUpRight size={14} /></a></article>)}</div></div>;
}

function DeadlinesView({ deadlinesList }: { deadlinesList: Deadline[] }) {
  const language = useLanguage();
  const exportCalendar = (items: Deadline[], all = false) => {
    const selectedItems = all ? items : items.slice(0, 1);
    const toDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "20270115" : date.toISOString().slice(0, 10).replaceAll("-", ""); };
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//UniQuest//Deadline Tracker//EN", ...selectedItems.flatMap(item => ["BEGIN:VEVENT", `UID:${item.id}@uniquest`, `DTSTART;VALUE=DATE:${toDate(item.date)}`, `SUMMARY:${item.label}`, `DESCRIPTION:${item.institution} · ${item.status}`, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const link = document.createElement("a"); link.href = url; link.download = all ? "uniquest-deadlines.ics" : "uniquest-next-deadline.ics"; link.click(); URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded. No email reminder was sent.");
  };
  return <div className="page-stack"><SectionHeader eyebrow="DEADLINE TRACKER" title="Keep the next decision visible." description="Your application calendar separates university deadlines from scholarships, documents, and language requirements." action={<button className="button button-secondary" onClick={() => toast.info("Email reminders require a configured notification provider; no email was sent.")}><Bell size={15} />{copy(language, "Configure reminders", "تنظیم یادآورها")}</button>} /><div className="calendar-summary"><div className="calendar-month"><div className="calendar-month-top"><button className="icon-button subtle"><ArrowDownRight size={16} /></button><strong>January 2027</strong><button className="icon-button subtle"><ArrowUpRight size={16} /></button></div><div className="calendar-week"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div className="calendar-days">{Array.from({ length: 31 }, (_, index) => { const day = index + 1; const marked = [15, 30].includes(day); return <span key={day} className={marked ? "calendar-day marked" : "calendar-day"}>{day}{marked ? <i /> : null}</span>; })}</div></div><div className="calendar-callout"><div className="eyebrow">YOUR CLOSEST MILESTONE</div><div className="countdown-large"><strong>59</strong><span>days</span></div><h3>Stipendium Hungaricum</h3><p>{copy(language, "Scholarship deadline · 15 January 2027", "مهلت بورسیه · ۱۵ ژانویه ۲۰۲۷")}</p><button className="button button-secondary" onClick={() => exportCalendar(deadlinesList)}>Add to calendar <CalendarDays size={15} /></button></div></div><div className="timeline-card"><div className="timeline-header"><div><div className="eyebrow">{copy(language, "ALL SAVED DATES", "همه تاریخ‌های ذخیره‌شده")}</div><h3>{copy(language, "Application calendar", "تقویم درخواست‌ها")}</h3></div><button className="text-button" onClick={() => exportCalendar(deadlinesList, true)}>Export .ics <ArrowUpRight size={14} /></button></div><div className="timeline-list">{deadlinesList.map(item => <div className="timeline-row" key={item.id}><div className={cls("timeline-icon", item.kind.toLowerCase())}>{item.kind === "Scholarship" ? <Crown size={16} /> : item.kind === "Language" ? <Languages size={16} /> : item.kind === "Documents" ? <FileText size={16} /> : <GraduationCap size={16} />}</div><div className="timeline-main"><div><strong>{item.label}</strong><span>{item.institution}</span></div><div className="timeline-status"><span className={item.status === "Needs action" ? "needs-action" : "upcoming-dot"} />{item.status}</div></div><div className="timeline-date"><strong>{item.date}</strong><span>{item.daysLeft} days left</span></div><MoreHorizontal size={18} /></div>)}</div></div></div>;
}

function CostsView({ matches, currency, onCurrencyChange }: { matches: ProgramMatch[]; currency: string; onCurrencyChange: (value: string) => void }) {
  const language = useLanguage();
  const [annualBudget, setAnnualBudget] = useState(18000);
  const selected = matches[3] ?? matches[0];
  if (!selected) return <div className="empty-state"><div className="empty-state-icon"><WalletCards size={23} /></div><div className="eyebrow">NO PROGRAMS IN VIEW</div><h2>Reset the search to plan a cost.</h2><p>Try a broader university, country, or scholarship search before opening the cost planner.</p></div>;
  const tuition = selected.id === "bologna-digital" ? 2400 : 16000;
  const living = selected.id === "bologna-digital" ? 10200 : 13800;
  const firstYear = tuition + living + 900;
  const gap = Math.max(0, firstYear - annualBudget);
  const bars = [{ label: "Tuition", value: tuition, color: "blue" }, { label: "Living", value: living, color: "navy" }, { label: "Insurance + visa", value: 900, color: "mint" }];
  return <div className="page-stack"><SectionHeader eyebrow="COST PLANNER" title="Make the financial gap concrete." description="Estimates are planning inputs, not visa or billing advice. Proof-of-funds requirements are shown separately from actual costs." action={<div className="currency-select"><span>Display</span><select value={currency} onChange={event => onCurrencyChange(event.target.value)}>{currencies.map(item => <option key={item}>{item}</option>)}</select><ChevronRight size={14} /></div>} /><div className="cost-hero"><div className="cost-hero-copy"><div className="eyebrow">PLANNING AROUND</div><h3>{selected.university} · {selected.program}</h3><p>Estimated first-year cost with a transparent breakdown.</p><div className="cost-total"><strong>{formatMoney(firstYear, currency)}</strong><span>first year</span></div><div className={gap > 0 ? "cost-gap gap" : "cost-gap covered"}>{gap > 0 ? <><ArrowDownRight size={15} />{formatMoney(gap, currency)} estimated gap vs annual budget</> : <><CheckCircle2 size={15} />Within your current annual budget</>}</div></div><div className="cost-bars">{bars.map(bar => <div className="cost-bar-row" key={bar.label}><div><span>{bar.label}</span><strong>{formatMoney(bar.value, currency)}</strong></div><div className="bar-track"><span className={`bar-${bar.color}`} style={{ width: `${(bar.value / firstYear) * 100}%` }} /></div></div>)}<div className="proof-funds-note"><ShieldCheck size={15} /><span><strong>{copy(language, "Proof of funds", "تمکن مالی")}</strong> · €11,904 visa requirement estimate. This is not the same as actual living cost.</span></div></div></div><div className="cost-grid"><div className="planner-card"><div className="rail-card-header"><div><div className="eyebrow">YOUR INPUT</div><h3>{copy(language, "Annual total budget", "بودجه کل سالانه")}</h3></div><WalletCards size={19} /></div><div className="budget-input"><span>€</span><input type="number" value={annualBudget} onChange={event => setAnnualBudget(Number(event.target.value))} /><span>/ year</span></div><input className="range-input" type="range" min="5000" max="60000" step="500" value={annualBudget} onChange={event => setAnnualBudget(Number(event.target.value))} /><div className="range-labels"><span>€5k</span><span>€60k</span></div><div className="planner-foot"><span>{copy(language, "Scholarship savings could reduce the gap.", "بورسیه می‌تواند این فاصله را کاهش دهد.")}</span><button className="text-button">Explore awards <ArrowUpRight size={14} /></button></div></div><div className="planner-card"><div className="rail-card-header"><div><div className="eyebrow">PROGRAM HORIZON</div><h3>Two-year estimate</h3></div><BarChart3 size={19} /></div><div className="program-total"><strong>{formatMoney(firstYear * 1.85, currency)}</strong><span>total program cost</span></div><div className="program-total-row"><span>Estimated scholarship savings</span><strong className="saving-text">−{formatMoney(9500, currency)}</strong></div><div className="program-total-row"><span>{copy(language, "Application + visa buffer", "هزینه درخواست و ویزا")}</span><strong>{formatMoney(1200, currency)}</strong></div><div className="data-note"><CircleHelp size={14} />{copy(language, "Verify current tuition and country rules before relying on this estimate.", "پیش از اتکا به این برآورد، شهریه و قوانین کشور را بررسی کنید.")}</div></div></div></div>;
}

function ComparisonView({ matches, compareIds, onRemove, onViewMatch }: { matches: ProgramMatch[]; compareIds: string[]; onRemove: (id: string) => void; onViewMatch: (match: ProgramMatch) => void }) {
  const language = useLanguage();
  const selected = matches.filter(match => compareIds.includes(match.id));
  if (!selected.length) return <div className="empty-state"><div className="empty-state-icon"><BarChart3 size={23} /></div><div className="eyebrow">COMPARE UP TO FIVE</div><h2>Build a decision table, not a browser-tab pile.</h2><p>Save a few programs from My matches, then compare tuition, requirements, deadlines, scholarship paths, and total cost side by side.</p><button className="button button-primary" onClick={() => matches[0] && onViewMatch(matches[0])} disabled={!matches.length}>Start with a match <ArrowUpRight size={15} /></button></div>;
  const rows: Array<[string, (match: ProgramMatch) => string]> = [["Fit band", item => item.tier], ["Annual tuition", item => item.tuition], ["Language", item => `${item.ielts} · ${item.toefl}`], ["Minimum GPA", item => item.minimumGpa], ["Deadline", item => item.deadline], ["Living estimate", item => item.living], ["Funding path", item => item.scholarship], ["Duration", item => item.duration]];
  return <div className="page-stack"><SectionHeader eyebrow="DECISION TABLE" title="See the trade-offs together." description="The strongest academic match is not always the most affordable option. Your evidence labels stay attached to every column." action={<span className="compare-count">{selected.length}/5 selected</span>} /><div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Decision signal</th>{selected.map(item => <th key={item.id}><div className="compare-header"><div className="university-avatar small">{item.shortName.slice(0, 2)}</div><div><strong>{item.shortName}</strong><span>{item.country}</span></div><button onClick={() => onRemove(item.id)}><X size={14} /></button></div></th>)}</tr></thead><tbody>{rows.map(([label, getter]) => <tr key={label}><td>{label}</td>{selected.map(item => <td key={item.id} className={label === "Fit band" ? tierClass(item.tier) : ""}>{getter(item)}</td>)}</tr>)}<tr><td>Evidence</td>{selected.map(item => <td key={item.id}><EvidenceChip status={item.evidence.status} /></td>)}</tr><tr><td>Action</td>{selected.map(item => <td key={item.id}><button className="text-button" onClick={() => onViewMatch(item)}>View source <ArrowUpRight size={14} /></button></td>)}</tr></tbody></table></div></div>;
}

function AssistantView({ messages, input, onInput, onAsk, isPending, profile, isAuthenticated }: { messages: Array<{ role: "assistant" | "user"; text: string }>; input: string; onInput: (value: string) => void; onAsk: (question?: string) => void; isPending: boolean; profile: ProfileDraft; isAuthenticated: boolean }) {
  const language = useLanguage();
  const prompts = ["Which country fits my budget best?", "Can I apply with IELTS 6.5?", "What should I verify before applying?"];
  return <div className="page-stack assistant-page"><SectionHeader eyebrow="ADMISSION ASSISTANT" title="Ask with your profile in context." description="Answers are grounded in the current source-linked catalog and clearly separated from official decisions." action={<div className="assistant-status"><span />{isAuthenticated ? "Saved profile context" : "Local draft context"}</div>} /><div className="assistant-layout"><div className="chat-card"><div className="chat-header"><div><div className="eyebrow">UNIQUEST AI</div><h3>{copy(language, "Application strategy desk", "میز استراتژی درخواست")}</h3></div><Sparkles size={19} /></div><div className="chat-messages">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={cls("chat-bubble-row", message.role === "user" && "chat-user-row")}><div className={cls("chat-avatar", message.role === "user" && "chat-user-avatar")}>{message.role === "assistant" ? <Compass size={16} /> : "M"}</div><div className={cls("chat-bubble", message.role === "user" && "chat-user-bubble")}>{message.text}</div></div>)}{isPending ? <div className="chat-bubble-row"><div className="chat-avatar"><Compass size={16} /></div><div className="chat-bubble loading-bubble"><span /><span /><span /></div></div> : null}</div><div className="prompt-row">{prompts.map(prompt => <button key={prompt} onClick={() => onAsk(prompt)}>{prompt}</button>)}</div><div className="chat-input-row"><input value={input} onChange={event => onInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter") onAsk(); }} placeholder="Ask about your next application step…" /><button className="button button-primary button-icon" onClick={() => onAsk()} disabled={!input.trim() || isPending}><Send size={16} /></button></div><div className="chat-disclaimer"><LockKeyhole size={13} />Uses saved profile signals · no guaranteed admissions</div></div><aside className="assistant-context"><div className="context-card"><div className="eyebrow">{copy(language, "CURRENT CONTEXT", "زمینه فعلی")}</div><h3>{profile.fullName}’s profile</h3><div className="context-item"><span>{copy(language, "Degree", "مقطع")}</span><strong>{profile.degreeLevel}</strong></div><div className="context-item"><span>{copy(language, "Field", "رشته")}</span><strong>{profile.fieldOfStudy}</strong></div><div className="context-item"><span>{copy(language, "Language", "زبان")}</span><strong>{profile.languageTest} {profile.languageScore}</strong></div><div className="context-item"><span>{copy(language, "Budget", "بودجه")}</span><strong>{profile.budgetCurrency}{profile.annualBudget} / year</strong></div><button className="button button-secondary full-width">{copy(language, "Edit profile", "ویرایش پروفایل")} <ChevronRight size={15} /></button></div><div className="context-card source-context"><div className="eyebrow">{copy(language, "HOW IT ANSWERS", "نحوه پاسخ‌گویی")}</div><h3>{copy(language, "Evidence first", "اول شواهد")}</h3><p>The assistant cites the current catalog record and tells you when a number needs an official source check.</p><div className="source-rule"><ShieldCheck size={14} />4 source-linked match records</div></div></aside></div></div>;
}

function ProfileView({ profile, onChange, onOpenAssessment, onLogin, user }: { profile: ProfileDraft; onChange: (next: ProfileDraft) => void; onOpenAssessment: () => void; onLogin: () => void; user: { name?: string | null; email?: string | null } | null }) {
  const language = useLanguage();
  return <div className="page-stack"><SectionHeader eyebrow="STUDENT PROFILE" title="Your application dossier." description="Keep the signal clean. Upload documents, correct extracted details, and reuse this profile across every shortlist." action={user ? <span className="signed-in-badge"><CheckCircle2 size={14} />Saved to account</span> : <button className="button button-secondary" onClick={onLogin}><LogIn size={15} />Sign in to sync</button>} /><div className="profile-layout"><div className="profile-main-card"><div className="profile-card-heading"><div className="profile-avatar-large">M</div><div><h3>{profile.fullName}</h3><p>{profile.degreeLevel} · {profile.fieldOfStudy}</p></div><button className="button button-secondary button-small" onClick={onOpenAssessment}>{copy(language, "Edit assessment", "ویرایش ارزیابی")}</button></div><div className="profile-fields-grid"><Field label="Full name" value={profile.fullName} onChange={value => onChange({ ...profile, fullName: value })} /><Field label="Nationality" value={profile.nationality} onChange={value => onChange({ ...profile, nationality: value })} /><Field label="Field of study" value={profile.fieldOfStudy} onChange={value => onChange({ ...profile, fieldOfStudy: value })} /><Field label="GPA" value={profile.gpa} onChange={value => onChange({ ...profile, gpa: value })} suffix={`/${profile.gradingScale}`} /><Field label="Language certificate" value={profile.languageTest} onChange={value => onChange({ ...profile, languageTest: value })} /><Field label="Overall score" value={profile.languageScore} onChange={value => onChange({ ...profile, languageScore: value })} /><Field label="Annual budget" value={profile.annualBudget} onChange={value => onChange({ ...profile, annualBudget: value })} suffix={profile.budgetCurrency} /><Field label="Preferred intake" value={profile.intake} onChange={value => onChange({ ...profile, intake: value })} /></div><div className="profile-country-row"><div><div className="eyebrow">PREFERRED DESTINATIONS</div><div className="chip-row">{profile.preferredCountries.map(country => <span className="country-chip" key={country}>{country}<X size={12} /></span>)}</div></div><button className="text-button">{copy(language, "Edit destinations", "ویرایش مقصدها")} <ArrowUpRight size={14} /></button></div></div><aside className="profile-side"><div className="upload-card"><div className="upload-icon"><CloudUpload size={20} /></div><div className="eyebrow">{copy(language, "DOCUMENT VAULT", "مخزن مدارک")}</div><h3>{copy(language, "Keep your evidence together.", "مدارک خود را یکجا نگه دارید.")}</h3><p>Upload a transcript for AI extraction, then review every field before it influences a match.</p><button className="upload-dropzone" onClick={onOpenAssessment}><UploadCloud size={19} /><span>{copy(language, "Upload transcript", "بارگذاری ریزنمرات")}</span><small>PDF, JPG, PNG · max 10 MB</small></button><div className="document-status"><FileCheck2 size={15} /><div><strong>{profile.transcriptFile ?? "No transcript uploaded"}</strong><span>{profile.transcriptFile ? "Ready for review" : "Add a transcript to improve the signal"}</span></div></div></div><div className="plan-card"><div className="plan-card-top"><div><div className="eyebrow">CURRENT PLAN</div><h3>Free workspace</h3></div><Crown size={18} /></div><p>3 searches left this month · Basic profile assessment</p><button className="button button-dark full-width">Explore Pro features <ArrowUpRight size={15} /></button></div></aside></div></div>;
}

function AssessmentModal({ profile, setProfile, step, setStep, onClose, onSave, onTranscriptSelect }: { profile: ProfileDraft; setProfile: (profile: ProfileDraft) => void; step: number; setStep: (step: number) => void; onClose: () => void; onSave: () => void; onTranscriptSelect: (file: File) => void }) {
  const language = useLanguage();
  const steps = ["Personal", "Academic", "Language", "Finances", "Review"];
  const update = (key: keyof ProfileDraft, value: string | string[]) => setProfile({ ...profile, [key]: value });
  const toggleCountry = (country: string) => update("preferredCountries", profile.preferredCountries.includes(country) ? profile.preferredCountries.filter(item => item !== country) : [...profile.preferredCountries, country]);
  const canNext = step < 4;
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className="assessment-modal"><div className="modal-header"><div><div className="eyebrow">PROFILE ASSESSMENT · STEP {step + 1} OF 5</div><h2>Build your admissions signal.</h2></div><button className="icon-button subtle" onClick={onClose}><X size={18} /></button></div><div className="stepper">{steps.map((label, index) => <button key={label} className={cls("step-item", index === step && "active", index < step && "complete")} onClick={() => setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span>{label}</button>)}</div><div className="modal-body">{step === 0 ? <div className="form-step"><div className="form-step-intro"><div className="step-icon"><Globe2 size={21} /></div><div><h3>Start with the person behind the application.</h3><p>We use this only to tailor country, funding, and deadline signals.</p></div></div><div className="form-grid"><Field label="Full name" value={profile.fullName} onChange={value => update("fullName", value)} /><Field label="Nationality" value={profile.nationality} onChange={value => update("nationality", value)} /><Field label="Current country of residence" value={profile.residence} onChange={value => update("residence", value)} /><Field label="Age" value={profile.age} onChange={value => update("age", value)} type="number" /><Field label="Email address" value={profile.email} onChange={value => update("email", value)} type="email" /></div></div> : null}{step === 1 ? <div className="form-step"><div className="form-step-intro"><div className="step-icon blue"><GraduationCap size={21} /></div><div><h3>Tell us how you got here.</h3><p>Academic compatibility is a signal, not a verdict. We will show the reason and the missing evidence.</p></div></div><div className="form-grid"><label className="field-wrap"><span className="field-label">Education level</span><select className="field-input" value={profile.degreeLevel} onChange={event => update("degreeLevel", event.target.value)}><option>High School</option><option>Bachelor's Degree</option><option>Master's Degree</option><option>PhD</option></select></label><Field label="Major / field of study" value={profile.fieldOfStudy} onChange={value => update("fieldOfStudy", value)} /><Field label="University name" value={profile.university} onChange={value => update("university", value)} /><div className="split-fields"><Field label="GPA" value={profile.gpa} onChange={value => update("gpa", value)} /><label className="field-wrap"><span className="field-label">Grading scale</span><select className="field-input" value={profile.gradingScale} onChange={event => update("gradingScale", event.target.value)}><option>4</option><option>5</option><option>10</option><option>20</option><option>100</option></select></label></div><Field label="Graduation year" value={profile.graduationYear} onChange={value => update("graduationYear", value)} /><label className="field-wrap full-field"><span className="field-label">{copy(language, "Research experience", "سابقه پژوهشی")}</span><textarea className="field-textarea" value={profile.researchExperience} onChange={event => update("researchExperience", event.target.value)} /></label></div><div className="upload-inline" onClick={() => document.getElementById("transcript-upload")?.click()}><CloudUpload size={19} /><div><strong>{profile.transcriptFile ? profile.transcriptFile : "Upload your transcript for AI extraction"}</strong><span>PDF, JPG, or PNG · review and correct before submitting</span></div><input id="transcript-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={event => { const file = event.target.files?.[0]; if (file) onTranscriptSelect(file); }} /><ChevronRight size={16} /></div></div> : null}{step === 2 ? <div className="form-step"><div className="form-step-intro"><div className="step-icon gold"><Languages size={21} /></div><div><h3>{copy(language, "Language can open the door — section scores keep it open.", "زبان می‌تواند در را باز کند؛ نمره‌های بخش‌ها آن را باز نگه می‌دارند.")}</h3><p>Applicants without a certificate can still search conditional-admission and preparatory-language pathways.</p></div></div><div className="form-grid"><label className="field-wrap full-field"><span className="field-label">{copy(language, "Certificate", "مدرک زبان")}</span><select className="field-input" value={profile.languageTest} onChange={event => update("languageTest", event.target.value)}><option>IELTS Academic</option><option>TOEFL iBT</option><option>PTE Academic</option><option>Duolingo English Test</option><option>Cambridge English</option><option>TestDaF / Goethe / ÖSD</option><option>DELF / DALF / TCF</option><option>{copy(language, "No certificate yet", "هنوز مدرکی ندارم")}</option></select></label><Field label="Overall score" value={profile.languageScore} onChange={value => update("languageScore", value)} /><Field label="Preferred study language" value={profile.preferredLanguage} onChange={value => update("preferredLanguage", value)} /><Field label="Test date" value="12 Apr 2026" onChange={() => undefined} type="date" /><Field label="Certificate expiry" value="12 Apr 2028" onChange={() => undefined} type="date" /></div><div className="section-callout"><ShieldCheck size={17} /><div><strong>Section scores are next.</strong><span>We will ask for Listening, Reading, Writing, and Speaking before a live application export.</span></div></div></div> : null}{step === 3 ? <div className="form-step"><div className="form-step-intro"><div className="step-icon mint"><WalletCards size={21} /></div><div><h3>Set the financial guardrails.</h3><p>We keep proof-of-funds rules separate from actual tuition and living costs.</p></div></div><div className="form-grid"><div className="split-fields"><Field label="Annual tuition budget" value={profile.annualBudget} onChange={value => update("annualBudget", value)} type="number" /><label className="field-wrap"><span className="field-label">Currency</span><select className="field-input" value={profile.budgetCurrency} onChange={event => update("budgetCurrency", event.target.value)}>{currencies.map(item => <option key={item}>{item}</option>)}</select></label></div><Field label="Total annual budget" value={profile.totalBudget} onChange={value => update("totalBudget", value)} type="number" suffix={profile.budgetCurrency} /><Field label="Proof of funds available" value={profile.proofOfFunds} onChange={value => update("proofOfFunds", value)} type="number" suffix={profile.budgetCurrency} /><label className="field-wrap full-field"><span className="field-label">{copy(language, "Funding need", "نیاز مالی")}</span><select className="field-input" value={profile.scholarshipNeed} onChange={event => update("scholarshipNeed", event.target.value)}><option>{copy(language, "Fully funded scholarship", "بورسیه کامل")}</option><option>{copy(language, "Partial funding", "تأمین مالی جزئی")}</option><option>{copy(language, "Self-funded", "تأمین مالی شخصی")}</option><option>{copy(language, "Not sure yet", "هنوز مطمئن نیستم")}</option></select></label></div><div className="country-selector"><div className="field-label">{copy(language, "Preferred countries", "کشورهای ترجیحی")}</div><div className="country-options">{countryList.slice(0, 9).map(country => <button key={country} className={cls("country-option", profile.preferredCountries.includes(country) && "selected")} onClick={() => toggleCountry(country)}>{profile.preferredCountries.includes(country) ? <Check size={14} /> : <Plus size={14} />}{country}</button>)}</div><button className="all-countries-button" onClick={() => update("preferredCountries", countryList)}>{copy(language, "Search all countries and recommend the best destinations", "جستجوی همه کشورها و پیشنهاد بهترین مقصدها")} <ArrowUpRight size={14} /></button></div></div> : null}{step === 4 ? <div className="form-step review-step"><div className="review-banner"><div className="review-banner-icon"><Sparkles size={19} /></div><div><strong>{copy(language, "Your profile is ready for a sharper first pass.", "پروفایل شما برای ارزیابی دقیق‌تر آماده است.")}</strong><span>We will rank programs with a rules-and-evidence model, then explain what to verify.</span></div></div><div className="review-grid"><div><div className="eyebrow">ACADEMIC SIGNAL</div><h3>{profile.degreeLevel} · {profile.fieldOfStudy}</h3><p>{profile.gpa}/{profile.gradingScale} GPA · {profile.languageTest} {profile.languageScore}</p></div><div><div className="eyebrow">FINANCIAL GUARDRAIL</div><h3>{profile.annualBudget} {profile.budgetCurrency} / year</h3><p>{profile.scholarshipNeed} · {profile.preferredCountries.length} destinations</p></div><div><div className="eyebrow">DOCUMENT STATUS</div><h3>{profile.transcriptFile ? "Transcript ready for review" : "Transcript not uploaded"}</h3><p>AI extraction never writes without your correction.</p></div></div><div className="review-note"><CircleHelp size={16} /><span>Current assessment is indicative. Admission decisions, fees, deadlines, and scholarship eligibility must be confirmed on the official source page.</span></div></div> : null}</div><div className="modal-footer"><button className="button button-ghost" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>{step > 0 ? "Back" : "Cancel"}</button><div className="modal-footer-right">{step < 4 ? <button className="button button-primary" onClick={() => setStep(step + 1)}>Continue <ChevronRight size={15} /></button> : <button className="button button-primary" onClick={onSave}><Sparkles size={15} />Update shortlist</button>}</div></div></div></div>;
}

function MatchDetailModal({ match, onClose }: { match: ProgramMatch; onClose: () => void }) {
  const language = useLanguage();
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className="detail-modal"><div className="modal-header"><div><div className="eyebrow">MATCH EVIDENCE · {match.flag} {match.country}</div><h2>{match.program}</h2><p>{match.university} · {match.city}</p></div><button className="icon-button subtle" onClick={onClose}><X size={18} /></button></div><div className="detail-score-row"><div className={cls("detail-tier", tierClass(match.tier))}><span />{match.tier}</div><div className="detail-score"><strong>{match.fitScore}</strong><span>indicative fit signal</span></div><EvidenceChip status={match.evidence.status} lastVerified={match.evidence.lastVerified} /></div><div className="detail-grid"><div><span>{copy(language, "Language", "زبان")}</span><strong>{match.language}</strong></div><div><span>{copy(language, "Duration", "مدت دوره")}</span><strong>{match.duration}</strong></div><div><span>{copy(language, "Tuition", "شهریه")}</span><strong>{match.tuition}</strong></div><div><span>{copy(language, "Deadline", "مهلت")}</span><strong>{match.deadline}</strong></div><div><span>IELTS / TOEFL</span><strong>{match.ielts} / {match.toefl}</strong></div><div><span>{copy(language, "Minimum GPA", "حداقل معدل")}</span><strong>{match.minimumGpa}</strong></div></div><div className="detail-explanation"><div className="detail-column"><div className="eyebrow">WHY IT MATCHES</div><p>{match.reason}</p><ul className="check-list"><li className="done"><CheckCircle2 size={15} />Subject and degree alignment</li><li className="done"><CheckCircle2 size={15} />{copy(language, "Language signal is in range", "نمره زبان در محدوده مناسب است")}</li><li className="done"><CheckCircle2 size={15} />{copy(language, "Next intake is visible", "نوبت پذیرش بعدی مشخص است")}</li></ul></div><div className="detail-column missing"><div className="eyebrow">VERIFY BEFORE APPLYING</div><ul className="check-list">{match.gaps.map(gap => <li key={gap}><CircleHelp size={15} />{gap}</li>)}</ul></div></div><div className="detail-source"><div><ShieldCheck size={16} /><span>{copy(language, "Source-linked record", "رکورد دارای منبع")} · {match.evidence.status}</span></div><a href={match.programUrl} target="_blank" rel="noreferrer">{copy(language, "Open official programme page", "باز کردن صفحه رسمی رشته")} <ArrowUpRight size={14} /></a></div></div></div>;
}

export default function Home() {
  const { user } = useAuth();
  const catalogQuery = trpc.catalog.snapshot.useQuery();
  const savedProfileQuery = trpc.profile.get.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const favoritesQuery = trpc.favorites.list.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const saveProfileMutation = trpc.profile.saveDraft.useMutation();
  const setFavoriteMutation = trpc.favorites.set.useMutation();
  const uploadDocumentMutation = trpc.documents.uploadAndAnalyze.useMutation();
  const assistantMutation = trpc.assistant.ask.useMutation();
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [language, setLanguage] = useState<Language>(() => normalizeLanguage(localStorage.getItem("uniquest-language")));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileDraft>(() => { try { return { ...initialProfile, ...JSON.parse(localStorage.getItem("uniquest-profile") || "{}") }; } catch { return initialProfile; } });
  const [savedIds, setSavedIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("uniquest-saved") || "[]"); } catch { return []; } });
  const [compareIds, setCompareIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("uniquest-compare") || "[]"); } catch { return []; } });
  const [currency, setCurrency] = useState("EUR");
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [detailMatch, setDetailMatch] = useState<ProgramMatch | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [assistantInput, setAssistantInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: copy(language, "Hi Mina — I’m looking at your Computer Science profile, IELTS 7.0 signal, and €18k annual guardrail. Ask me where to focus next, and I’ll keep the evidence visible.", "سلام مینا — پروفایل Computer Science، نمره IELTS 7.0 و بودجه سالانه €18k شما را بررسی می‌کنم. درباره قدم بعدی سؤال کنید تا شواهد را شفاف نگه داریم.") }]);

  const catalog = catalogQuery.data;
  const matches = useMemo(() => (catalog?.matches ?? fallbackMatches).filter(item => `${item.university} ${item.program} ${item.country}`.toLowerCase().includes(searchTerm.toLowerCase())), [catalog?.matches, searchTerm]);
  const scholarshipsList = catalog?.scholarships ?? fallbackScholarships;
  const deadlinesList = catalog?.deadlines ?? fallbackDeadlines;

  useEffect(() => { localStorage.setItem("uniquest-profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem("uniquest-saved", JSON.stringify(savedIds)); }, [savedIds]);
  useEffect(() => { localStorage.setItem("uniquest-compare", JSON.stringify(compareIds)); }, [compareIds]);
  useEffect(() => { localStorage.setItem("uniquest-language", language); document.documentElement.lang = language === "fa" ? "fa" : "en"; }, [language]);
  useEffect(() => {
    if (!user || !savedProfileQuery.data?.profileData) return;
    const profileData = savedProfileQuery.data.profileData;
    try { setProfile(current => ({ ...current, ...JSON.parse(profileData as string) })); } catch { /* keep the local draft if an older record is malformed */ }
  }, [user?.id, savedProfileQuery.data?.profileData]);
  useEffect(() => {
    if (user && favoritesQuery.data) setSavedIds(favoritesQuery.data.filter(item => item.entityType === "program").map(item => item.entityId));
  }, [user?.id, favoritesQuery.data]);

  const handleProfileChange = (next: ProfileDraft) => setProfile(next);
  const openAssessment = () => { setAssessmentStep(0); setAssessmentOpen(true); };
  const saveAssessment = async () => { if (user) { try { await saveProfileMutation.mutateAsync(profile); toast.success("Profile saved to your account."); } catch { toast.error("Could not sync the profile yet; your local draft is safe."); } } else { toast.success("Profile updated locally. Sign in to sync across devices."); } setAssessmentOpen(false); setActiveView("matches"); };
  const handleTranscriptSelect = async (file: File) => {
    setProfile(current => ({ ...current, transcriptFile: file.name }));
    if (!user) {
      toast.success("Transcript added to this local draft. Sign in to enable secure storage and AI extraction.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const dataBase64 = dataUrl.split(",")[1] ?? "";
      if (!dataBase64) return;
      try {
        const response = await uploadDocumentMutation.mutateAsync({ fileName: file.name, mimeType: file.type as "application/pdf" | "image/jpeg" | "image/png", dataBase64, documentType: "transcript" });
        if (response.status === "review") {
          const extracted = response.extractedData as { gpa?: string; major?: string } | undefined;
          setProfile(current => ({ ...current, transcriptFile: file.name, gpa: extracted?.gpa || current.gpa, fieldOfStudy: extracted?.major || current.fieldOfStudy }));
          toast.success("Transcript analyzed. Review the extracted fields before continuing.");
        } else if (response.status === "integration-required") {
          toast.info("Secure storage is not configured here; the local draft is safe and the integration status is visible.");
        } else {
          toast.success("Transcript uploaded for review.");
        }
      } catch {
        toast.error("Transcript upload failed; your local file selection is still preserved.");
      }
    };
    reader.readAsDataURL(file);
  };
  const toggleSave = (id: string) => setSavedIds(current => { const saved = !current.includes(id); if (user) setFavoriteMutation.mutate({ entityType: "program", entityId: id, saved }); return saved ? [...current, id] : current.filter(item => item !== id); });
  const toggleCompare = (id: string) => setCompareIds(current => current.includes(id) ? current.filter(item => item !== id) : current.length >= 5 ? (toast.error("You can compare up to five programs."), current) : [...current, id]);
  const askAssistant = async (preset?: string) => { const question = (preset ?? assistantInput).trim(); if (!question) return; setMessages(current => [...current, { role: "user", text: question }]); setAssistantInput(""); try { const response = await assistantMutation.mutateAsync({ question, language, profile: { degreeLevel: profile.degreeLevel, fieldOfStudy: profile.fieldOfStudy, gpa: profile.gpa, languageTest: profile.languageTest, languageScore: profile.languageScore, annualBudget: profile.annualBudget, budgetCurrency: profile.budgetCurrency, preferredCountries: profile.preferredCountries } }); setMessages(current => [...current, { role: "assistant", text: `${response.answer}\n\n${language === "fa" ? "حالت پاسخ" : "Mode"}: ${response.integrationStatus}.` }]); } catch { setMessages(current => [...current, { role: "assistant", text: copy(language, "I could not reach the assistant service. Your shortlist is still available; review each official source while the integration is reconnected.", "به سرویس دستیار دسترسی برقرار نشد. فهرست پیشنهادها در دسترس است؛ تا اتصال دوباره سرویس، منابع رسمی را بررسی کنید.") }]); } };

  const renderView = () => {
    if (activeView === "overview") return <Overview profile={profile} matches={matches} scholarshipsList={scholarshipsList} deadlinesList={deadlinesList} savedIds={savedIds} compareIds={compareIds} onSave={toggleSave} onCompare={toggleCompare} onOpenMatch={setDetailMatch} onOpenAssessment={openAssessment} onView={setActiveView} />;
    if (activeView === "matches") return <MatchesView matches={matches} savedIds={savedIds} compareIds={compareIds} onSave={toggleSave} onCompare={toggleCompare} onOpenMatch={setDetailMatch} />;
    if (activeView === "scholarships") return <ScholarshipsView scholarshipsList={scholarshipsList} onView={setActiveView} />;
    if (activeView === "deadlines") return <DeadlinesView deadlinesList={deadlinesList} />;
    if (activeView === "costs") return <CostsView matches={matches} currency={currency} onCurrencyChange={setCurrency} />;
    if (activeView === "comparison") return <ComparisonView matches={matches} compareIds={compareIds} onRemove={toggleCompare} onViewMatch={setDetailMatch} />;
    if (activeView === "assistant") return <AssistantView messages={messages} input={assistantInput} onInput={setAssistantInput} onAsk={askAssistant} isPending={assistantMutation.isPending} profile={profile} isAuthenticated={Boolean(user)} />;
    return <ProfileView profile={profile} onChange={handleProfileChange} onOpenAssessment={openAssessment} onLogin={() => startLogin()} user={user ?? null} />;
  };

  return <LanguageContext.Provider value={language}><div className={cls("app-shell", language === "fa" && "rtl-shell")} dir={textDirection(language)}><Sidebar activeView={activeView} onChange={view => { setActiveView(view); setMobileMenuOpen(false); }} language={language} onLanguageChange={setLanguage} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(current => !current)} /><div className="app-main"><Topbar onSearch={setSearchTerm} onOpenAssessment={openAssessment} user={user ?? null} onLogin={() => startLogin()} language={language} /><div className="mobile-nav-toggle"><button className="icon-button subtle" onClick={() => setMobileMenuOpen(current => !current)}>{mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}</button><span>{language === "fa" ? navItems.find(item => item.key === activeView)?.faLabel : navItems.find(item => item.key === activeView)?.label}</span></div><main className="main-content">{renderView()}</main><footer className="app-footer"><span>{language === "fa" ? "UniQuest · شفاف از ابتدا" : "UniQuest · transparent by design"}</span><span><a href="https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc" target="_blank" rel="noreferrer">{language === "fa" ? "منابع" : "Sources"}</a> · <button onClick={() => toast.info(language === "fa" ? "اتصال منابع داده برای پیکربندی آماده است." : "Data refresh connectors are ready for configuration in the admin workspace.")}>{language === "fa" ? "وضعیت داده" : "Data status"}</button></span></footer></div>{mobileMenuOpen ? <div className="mobile-drawer"><div className="mobile-drawer-header"><strong>{language === "fa" ? "فضای کاری" : "Workspace"}</strong><button className="icon-button subtle" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button></div>{navItems.map(item => { const IconComponent = item.icon; return <button key={item.key} className={cls("nav-item", activeView === item.key && "nav-item-active")} onClick={() => { setActiveView(item.key); setMobileMenuOpen(false); }}><IconComponent size={18} />{language === "fa" ? item.faLabel : item.label}</button>; })}</div> : null}{assessmentOpen ? <AssessmentModal profile={profile} setProfile={setProfile} step={assessmentStep} setStep={setAssessmentStep} onClose={() => setAssessmentOpen(false)} onSave={saveAssessment} onTranscriptSelect={handleTranscriptSelect} /> : null}{detailMatch ? <MatchDetailModal match={detailMatch} onClose={() => setDetailMatch(null)} /> : null}</div></LanguageContext.Provider>;
}

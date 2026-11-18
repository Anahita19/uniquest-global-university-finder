export type VerificationStatus = "Verified" | "Estimated" | "Unconfirmed";
export type MatchTier = "Safe" | "Good match" | "Ambitious" | "Not eligible";

export type Evidence = {
  status: VerificationStatus;
  lastVerified: string;
  sourceUrl: string;
};

export type ProgramMatch = {
  id: string;
  university: string;
  shortName: string;
  country: string;
  city: string;
  flag: string;
  program: string;
  degree: "Master's" | "Bachelor's" | "PhD";
  field: string;
  language: string;
  duration: string;
  tier: MatchTier;
  fitScore: number;
  tuition: string;
  applicationFee: string;
  deadline: string;
  nextIntake: string;
  ielts: string;
  toefl: string;
  minimumGpa: string;
  living: string;
  ranking: string;
  scholarship: string;
  reason: string;
  gaps: string[];
  officialUrl: string;
  programUrl: string;
  applicationUrl: string;
  evidence: Evidence;
};

export type Scholarship = {
  id: string;
  name: string;
  funder: string;
  country: string;
  coverage: string;
  stipend: string;
  deadline: string;
  status: "Open" | "Upcoming" | "Closed";
  match: string;
  type: string;
  officialUrl: string;
  evidence: Evidence;
};

export type Deadline = {
  id: string;
  label: string;
  kind: "Application" | "Scholarship" | "Documents" | "Language";
  date: string;
  daysLeft: number;
  institution: string;
  status: "Upcoming" | "Needs action";
};

export const programMatches: ProgramMatch[] = [
  {
    id: "tum-informatics",
    university: "Technical University of Munich",
    shortName: "TUM",
    country: "Germany",
    city: "Munich",
    flag: "DE",
    program: "MSc Informatics",
    degree: "Master's",
    field: "Computer Science",
    language: "English",
    duration: "2 years",
    tier: "Good match",
    fitScore: 86,
    tuition: "€0–€6k / year",
    applicationFee: "Check source",
    deadline: "15 Jan 2027",
    nextIntake: "Winter 2027",
    ielts: "6.5 overall",
    toefl: "88 iBT",
    minimumGpa: "Equivalent to German 2.5",
    living: "€1,150 / month est.",
    ranking: "QS 2026 · #22 Computer Science",
    scholarship: "DAAD / TUM scholarships",
    reason: "Your computer science degree and IELTS 7.0 align with the published language and subject profile.",
    gaps: ["Transcript conversion method", "Current tuition for non-EU applicants"],
    officialUrl: "https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc",
    programUrl: "https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc",
    applicationUrl: "https://campus.tum.de/",
    evidence: { status: "Estimated", lastVerified: "17 Nov 2026", sourceUrl: "https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc" },
  },
  {
    id: "uva-ai",
    university: "University of Amsterdam",
    shortName: "UvA",
    country: "Netherlands",
    city: "Amsterdam",
    flag: "NL",
    program: "MSc Artificial Intelligence",
    degree: "Master's",
    field: "Artificial Intelligence",
    language: "English",
    duration: "2 years",
    tier: "Good match",
    fitScore: 82,
    tuition: "€17k–€24k / year",
    applicationFee: "€100 est.",
    deadline: "1 Feb 2027",
    nextIntake: "September 2027",
    ielts: "7.0 overall",
    toefl: "100 iBT",
    minimumGpa: "Strong upper second",
    living: "€1,450 / month est.",
    ranking: "THE 2026 · AI subject leader",
    scholarship: "Amsterdam Merit Scholarship",
    reason: "Strong subject fit and research experience support the match; budget is the main pressure point.",
    gaps: ["Proof of funds exceeds current budget", "Check section-score minimums"],
    officialUrl: "https://www.uva.nl/en/programmes/masters/artificial-intelligence/artificial-intelligence.html",
    programUrl: "https://www.uva.nl/en/programmes/masters/artificial-intelligence/artificial-intelligence.html",
    applicationUrl: "https://student.uva.nl/en/topics/applying-for-a-masters-programme",
    evidence: { status: "Estimated", lastVerified: "17 Nov 2026", sourceUrl: "https://www.uva.nl/en/programmes/masters/artificial-intelligence/artificial-intelligence.html" },
  },
  {
    id: "glasgow-data",
    university: "University of Glasgow",
    shortName: "UofG",
    country: "United Kingdom",
    city: "Glasgow",
    flag: "GB",
    program: "MSc Data Science",
    degree: "Master's",
    field: "Data Science",
    language: "English",
    duration: "1 year",
    tier: "Ambitious",
    fitScore: 71,
    tuition: "£29k–£34k / year",
    applicationFee: "No fee listed",
    deadline: "Rolling · verify",
    nextIntake: "September 2027",
    ielts: "6.5 overall",
    toefl: "90 iBT",
    minimumGpa: "2:1 equivalent",
    living: "£1,050 / month est.",
    ranking: "QS 2026 · #89 overall",
    scholarship: "Global Leadership Scholarship",
    reason: "You meet the language signal, but the programme’s competition and total cost make it an ambitious option.",
    gaps: ["Funding plan", "Confirm prerequisite mathematics modules"],
    officialUrl: "https://www.gla.ac.uk/postgraduate/taught/datascience/",
    programUrl: "https://www.gla.ac.uk/postgraduate/taught/datascience/",
    applicationUrl: "https://www.gla.ac.uk/postgraduate/howtoapply/",
    evidence: { status: "Unconfirmed", lastVerified: "17 Nov 2026", sourceUrl: "https://www.gla.ac.uk/postgraduate/taught/datascience/" },
  },
  {
    id: "bologna-digital",
    university: "University of Bologna",
    shortName: "UNIBO",
    country: "Italy",
    city: "Bologna",
    flag: "IT",
    program: "MSc Digital Technologies",
    degree: "Master's",
    field: "Digital Innovation",
    language: "English",
    duration: "2 years",
    tier: "Safe",
    fitScore: 92,
    tuition: "€1k–€4k / year",
    applicationFee: "€20–€50 est.",
    deadline: "30 Apr 2027",
    nextIntake: "September 2027",
    ielts: "6.0 overall",
    toefl: "80 iBT",
    minimumGpa: "Meets published baseline",
    living: "€850 / month est.",
    ranking: "QS 2026 · #138 overall",
    scholarship: "ER.GO / regional support",
    reason: "The combination of lower estimated cost, subject alignment, and a later deadline makes this your strongest practical option.",
    gaps: ["Confirm exact programme title", "Regional scholarship income thresholds"],
    officialUrl: "https://www.unibo.it/en/teaching/degree-programmes",
    programUrl: "https://www.unibo.it/en/teaching/degree-programmes",
    applicationUrl: "https://studenti.unibo.it/sol/welcome.htm",
    evidence: { status: "Unconfirmed", lastVerified: "17 Nov 2026", sourceUrl: "https://www.unibo.it/en/teaching/degree-programmes" },
  },
];

export const scholarships: Scholarship[] = [
  { id: "daad", name: "DAAD Study Scholarships", funder: "German Academic Exchange Service", country: "Germany", coverage: "Tuition support varies", stipend: "Monthly stipend + insurance", deadline: "15 Oct 2027", status: "Upcoming", match: "High match", type: "Government / merit", officialUrl: "https://www.daad.de/en/studying-in-germany/scholarships/", evidence: { status: "Verified", lastVerified: "17 Nov 2026", sourceUrl: "https://www.daad.de/en/studying-in-germany/scholarships/" } },
  { id: "erasmus", name: "Erasmus Mundus Joint Masters", funder: "European Commission", country: "Europe", coverage: "Full scholarship possible", stipend: "Monthly stipend + travel", deadline: "Varies by consortium", status: "Open", match: "High match", type: "Fully funded", officialUrl: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en", evidence: { status: "Verified", lastVerified: "17 Nov 2026", sourceUrl: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en" } },
  { id: "stipi", name: "Stipendium Hungaricum", funder: "Tempus Public Foundation", country: "Hungary", coverage: "Tuition + accommodation", stipend: "Monthly stipend", deadline: "15 Jan 2027", status: "Open", match: "Good match", type: "Government / fully funded", officialUrl: "https://stipendiumhungaricum.hu/", evidence: { status: "Verified", lastVerified: "17 Nov 2026", sourceUrl: "https://stipendiumhungaricum.hu/" } },
  { id: "chevening", name: "Chevening Scholarships", funder: "UK Foreign, Commonwealth & Development Office", country: "United Kingdom", coverage: "Fully funded", stipend: "Monthly living allowance", deadline: "Closed · next cycle", status: "Closed", match: "Needs work experience", type: "Government / leadership", officialUrl: "https://www.chevening.org/scholarships/", evidence: { status: "Verified", lastVerified: "17 Nov 2026", sourceUrl: "https://www.chevening.org/scholarships/" } },
];

export const deadlines: Deadline[] = [
  { id: "d1", label: "TUM MSc Informatics application", kind: "Application", date: "15 Jan 2027", daysLeft: 59, institution: "Technical University of Munich", status: "Needs action" },
  { id: "d2", label: "Stipendium Hungaricum", kind: "Scholarship", date: "15 Jan 2027", daysLeft: 59, institution: "Tempus Public Foundation", status: "Upcoming" },
  { id: "d3", label: "UvA application materials", kind: "Documents", date: "1 Feb 2027", daysLeft: 76, institution: "University of Amsterdam", status: "Upcoming" },
  { id: "d4", label: "IELTS score validity check", kind: "Language", date: "28 Feb 2027", daysLeft: 103, institution: "Profile requirement", status: "Upcoming" },
];

export const countries = ["Germany", "Italy", "Netherlands", "United Kingdom", "France", "Austria", "Sweden", "Canada", "United States", "Australia", "Japan", "South Korea"];

export const catalogMeta = {
  lastSync: "17 Nov 2026",
  records: 1284,
  sources: 46,
  liveConnectors: 0,
  note: "Preview records are source-linked and labeled by verification state. Connect official feeds before treating estimated values as current.",
};

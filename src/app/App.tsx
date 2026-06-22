import { useState, useEffect } from "react";
import { X, ChevronLeft, Check, Home, Users, Trophy, Globe, Zap, ArrowRight, Star, Lock, Gamepad2 } from "lucide-react";
import LegacyMode from "./LegacyMode";
import FanZoneScreen from "./FanZone";
import { getLiveFixtures, Fixture } from "../services/api-football";
import { BookOpen } from "lucide-react";
import KeyTermsScreen from "./KeyTerms";
import FormationsScreen from "./Formations";
import { Pitch3D } from "./components/Pitch3D";
import { loginUser, getUserData, addUserXP, saveQuizCompletion, saveMatchPrediction, updatePredictionResult, subscribeToAuth, logoutUser } from "../services/firebase";
import { getDailyQuiz } from "../services/ai-quiz";
import Chatbot from "./components/Chatbot";
import { AuthScreen } from "./components/AuthScreen";
import wc2022Data from "../data/wc2022_stats.json";
import PHILOSOPHIES from "../data/philosophies.json";

/* ─── Palette ────────────────────────────────────────────── */
const C = {
  bg: "#0d1033", sapphire: "#2A398D", sapphireDk: "#1f2d7a",
  sapphireSm: "#1a2258", red: "#E61D25", redDk: "#b0151b",
  green: "#3CAC3B", gray: "#D1D4D1", white: "#ffffff",
  border: "rgba(255,255,255,0.1)", borderSub: "rgba(255,255,255,0.06)",
};

/* ─── Font shorthands ────────────────────────────────────── */
const TEKO:   React.CSSProperties = { fontFamily: "'Teko', sans-serif" };
const BARLOW: React.CSSProperties = { fontFamily: "'Barlow', sans-serif" };
const MONO:   React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

/* ─── Types ──────────────────────────────────────────────── */
type Screen = "login" | "dashboard" | "roster" | "tactical" | "fanzone" | "dictionary" | "philosophies";

interface Player { // roster player (has stats)
  id: number; name: string; abbr: string; pos: string;
  team: string; flag: string; rating: number;
  pac: number; sho: number; pas: number; dri: number; def: number; phy: number;
  role: string; tactical: string; watch: string;
}
interface SquadMember { // real WC squad player
  n: number; name: string; full: string;
  pos: "GK"|"DF"|"MF"|"FW"; slotRole: string; club: string; note: string;
}
interface BenchMember { n: number; name: string; pos: string; club: string; }
interface TeamSquad {
  defaultFormation: string;
  starters: SquadMember[]; // length 11, ordered to match formation slots
  bench: BenchMember[];
}
interface PitchPlayer extends SquadMember { x: number; y: number; }
interface PosItem { n: number; role: string; x: number; y: number; }

/* ─── 2026 World Cup Real Squad Data ─────────────────────── */
const SQUAD_DATA: Record<string, TeamSquad> = {
  bra: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Alisson",     full:"Alisson Becker",    pos:"GK", slotRole:"GK",  club:"Liverpool",    note:"Sweeper-keeper who organises the back line and launches attacks with precise distribution. Among the world's best." },
    { n:6,  name:"Alex Sandro", full:"Alex Sandro",       pos:"DF", slotRole:"LB",  club:"Flamengo",     note:"Experienced left-back who overlaps to support Vinícius Jr. and delivers reliable crosses from the flank." },
    { n:4,  name:"Marquinhos",  full:"Marquinhos",        pos:"DF", slotRole:"CB",  club:"PSG",          note:"Captain and defensive leader. Reads the game brilliantly, drives possession from deep, and organises calmly." },
    { n:3,  name:"Bremer",      full:"Gleison Bremer",    pos:"DF", slotRole:"CB",  club:"Juventus",     note:"Physical and dominant in the air. Gives Brazil a combative edge and shuts down elite strikers relentlessly." },
    { n:2,  name:"Danilo",      full:"Danilo",            pos:"DF", slotRole:"RB",  club:"Flamengo",     note:"Versatile right-back who provides width and tactical discipline. A trusted, experienced voice in the squad." },
    { n:5,  name:"Casemiro",    full:"Casemiro",          pos:"MF", slotRole:"LCM", club:"Man United",   note:"The midfield destroyer. Wins second balls, breaks up opponent play, and shields the defence selflessly." },
    { n:8,  name:"B. Guimarães",full:"Bruno Guimarães",   pos:"MF", slotRole:"CM",  club:"Newcastle",    note:"Box-to-box powerhouse who carries the ball forward. Covers enormous ground and links defence to attack." },
    { n:17, name:"Paquetá",     full:"Lucas Paquetá",     pos:"MF", slotRole:"RCM", club:"Flamengo",     note:"Elegant technician who drifts into wide areas and creates chances between the lines with sharp passing." },
    { n:11, name:"Vinícius Jr", full:"Vinícius Jr.",      pos:"FW", slotRole:"LW",  club:"Real Madrid",  note:"Explosive pace and unpredictable dribbling from the left. Cuts inside to shoot or pulls wide to cross." },
    { n:10, name:"Neymar",      full:"Neymar Jr.",        pos:"FW", slotRole:"ST",  club:"Santos",       note:"Brazil's returning icon. Creates from nothing, draws fouls constantly, and still provides pure magic." },
    { n:7,  name:"Raphinha",    full:"Raphinha",          pos:"FW", slotRole:"RW",  club:"Barcelona",    note:"High-pressing winger who delivers dangerous balls and contributes consistently with goals and assists." },
  ], bench: [
    {n:12,name:"Ederson",      pos:"GK",club:"Fenerbahce"}, {n:23,name:"Weverton",     pos:"GK",club:"Grêmio"},
    {n:13,name:"Gabriel",      pos:"DF",club:"Arsenal"},    {n:14,name:"Leo Pereira",  pos:"DF",club:"Flamengo"},
    {n:15,name:"D. Santos",    pos:"DF",club:"Zenit"},      {n:9, name:"Endrick",      pos:"FW",club:"Real Madrid"},
    {n:20,name:"Martinelli",   pos:"FW",club:"Arsenal"},    {n:21,name:"M. Cunha",     pos:"FW",club:"Man United"},
    {n:18,name:"Fabinho",      pos:"MF",club:"Al-Ittihad"}, {n:19,name:"Ederson A.",   pos:"MF",club:"Atalanta"},
  ]},

  arg: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Emi Martínez",full:"Emiliano Martínez", pos:"GK", slotRole:"GK",  club:"Aston Villa",  note:"World Cup hero of Qatar 2022. Elite penalty stopper who commands his area with infectious confidence." },
    { n:3,  name:"Tagliafico",  full:"Nicolás Tagliafico",pos:"DF", slotRole:"LB",  club:"Lyon",         note:"Solid left-back who tracks runs diligently and supports attacks with reliable overlapping runs." },
    { n:6,  name:"L. Martínez", full:"Lisandro Martínez", pos:"DF", slotRole:"CB",  club:"Man United",   note:"Combative, aggressive centre-back who wins duels with ferocity and organises the defensive shape." },
    { n:13, name:"Romero",      full:"Cristian Romero",   pos:"DF", slotRole:"CB",  club:"Tottenham",    note:"Tenacious and physical. Reads danger early, makes last-ditch tackles, and dominates in the air." },
    { n:2,  name:"Molina",      full:"Nahuel Molina",     pos:"DF", slotRole:"RB",  club:"Atlético",     note:"Marauding right-back who becomes a winger in possession. Great delivery and explosive pace forward." },
    { n:5,  name:"Mac Allister",full:"Alexis Mac Allister",pos:"MF",slotRole:"LCM", club:"Liverpool",    note:"Mobile, technically refined midfielder. Covers ground efficiently and finds key passes in tight spaces." },
    { n:7,  name:"De Paul",     full:"Rodrigo De Paul",   pos:"MF", slotRole:"CM",  club:"Inter Miami",  note:"Relentless engine of Argentina's midfield. Carries the ball into dangerous positions under intense pressure." },
    { n:24, name:"Enzo Fndz",   full:"Enzo Fernández",    pos:"MF", slotRole:"RCM", club:"Chelsea",      note:"Dynamic box-to-box midfielder with progressive passing and the ability to arrive late with powerful shots." },
    { n:10, name:"Messi",       full:"Lionel Messi",      pos:"FW", slotRole:"LW",  club:"Inter Miami",  note:"The greatest of all time. Still dazzles at 37 with vision, dribbling, and goals that defy belief." },
    { n:22, name:"Lautaro",     full:"Lautaro Martínez",  pos:"FW", slotRole:"ST",  club:"Inter Milan",  note:"Clinical, powerful striker who presses from the front and finishes with both feet with equal quality." },
    { n:9,  name:"J. Álvarez",  full:"Julián Álvarez",    pos:"FW", slotRole:"RW",  club:"Atlético",     note:"Tireless forward who creates space, harries defenders, and scores crucial goals in the biggest moments." },
  ], bench: [
    {n:23,name:"Rulli",       pos:"GK",club:"Marseille"},  {n:12,name:"Musso",       pos:"GK",club:"Atlético"},
    {n:4, name:"Balerdi",     pos:"DF",club:"Marseille"},  {n:19,name:"Otamendi",    pos:"DF",club:"Benfica"},
    {n:11,name:"N. González", pos:"FW",club:"Atlético"},   {n:14,name:"Lo Celso",    pos:"MF",club:"Real Betis"},
    {n:15,name:"Palacios",    pos:"MF",club:"Leverkusen"}, {n:16,name:"Paredes",     pos:"MF",club:"Boca Juniors"},
    {n:17,name:"G. Simeone",  pos:"FW",club:"Atlético"},
  ]},

  fra: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Maignan",     full:"Mike Maignan",       pos:"GK", slotRole:"GK",  club:"AC Milan",     note:"Athletic goalkeeper with explosive reflexes. Excellent distribution makes him a sweeper-keeper of the highest level." },
    { n:3,  name:"T. Hernández",full:"Theo Hernández",     pos:"DF", slotRole:"LB",  club:"Al-Hilal",     note:"One of the most aggressive, attack-minded left-backs in world football. Drives forward at devastating pace." },
    { n:5,  name:"Konaté",      full:"Ibrahima Konaté",    pos:"DF", slotRole:"CB",  club:"Liverpool",    note:"Powerful and rapid centre-back comfortable in a very high defensive line. Dominates attackers physically." },
    { n:4,  name:"Saliba",      full:"William Saliba",     pos:"DF", slotRole:"CB",  club:"Arsenal",      note:"Elegant ball-playing centre-back. Distributes with quality and is rarely caught in possession under pressure." },
    { n:2,  name:"Gusto",       full:"Malo Gusto",         pos:"DF", slotRole:"RB",  club:"Chelsea",      note:"Athletic young right-back who excels in transition. Strong defensively and dangerous in the final third." },
    { n:8,  name:"Kanté",       full:"N'Golo Kanté",      pos:"MF", slotRole:"LCM", club:"Fenerbahce",   note:"Legendary destroyer. Reads the game, intercepts, presses, and links play with deceptive simplicity." },
    { n:6,  name:"Tchouaméni",  full:"Aurélien Tchouaméni",pos:"MF", slotRole:"CM",  club:"Real Madrid",  note:"Deep-lying midfielder who dictates tempo. Exceptional range of passing and covers enormous ground." },
    { n:22, name:"Zaïre-Emery", full:"Warren Zaïre-Emery",pos:"MF", slotRole:"RCM", club:"PSG",          note:"Teenage sensation who plays without fear. Dynamic runner who gets into goal-scoring positions regularly." },
    { n:11, name:"Dembélé",     full:"Ousmane Dembélé",   pos:"FW", slotRole:"LW",  club:"PSG",          note:"Lightning-quick winger who terrifies defenders. Unpredictable movement and direct dribbling in 1v1 situations." },
    { n:10, name:"Mbappé",      full:"Kylian Mbappé",     pos:"FW", slotRole:"ST",  club:"Real Madrid",  note:"The fastest human with a football at this level. Devastating on the counter, lethal in front of goal." },
    { n:7,  name:"Doué",        full:"Désiré Doué",       pos:"FW", slotRole:"RW",  club:"PSG",          note:"Exciting young winger — direct, courageous in 1v1s, with a natural eye for goal from wide positions." },
  ], bench: [
    {n:16,name:"Risser",      pos:"GK",club:"Lens"},        {n:23,name:"Samba",       pos:"GK",club:"Rennes"},
    {n:14,name:"Upamecano",   pos:"DF",club:"Bayern"},      {n:15,name:"Lacroix",     pos:"DF",club:"C. Palace"},
    {n:12,name:"Koundé",      pos:"DF",club:"Barcelona"},   {n:9, name:"Thuram",      pos:"FW",club:"Inter Milan"},
    {n:13,name:"Mateta",      pos:"FW",club:"C. Palace"},   {n:17,name:"Olise",       pos:"FW",club:"Bayern"},
    {n:18,name:"Barcola",     pos:"FW",club:"PSG"},
  ]},

  esp: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Unai Simón",  full:"Unai Simón",          pos:"GK", slotRole:"GK",  club:"Athletic Club",note:"Confident goalkeeper who sweeps behind a very high defensive line. Top-class technical proficiency with feet." },
    { n:3,  name:"Grimaldo",    full:"Álex Grimaldo",       pos:"DF", slotRole:"LB",  club:"Leverkusen",   note:"Elegant left-back with superb delivery. Creates goal-scoring opportunities with crosses and free kicks." },
    { n:14, name:"Cubarsí",     full:"Pau Cubarsí",         pos:"DF", slotRole:"CB",  club:"Barcelona",    note:"Teenage prodigy who looks like a veteran. Reads the game beyond his years and carries the ball with ease." },
    { n:4,  name:"Laporte",     full:"Aymeric Laporte",     pos:"DF", slotRole:"CB",  club:"Athletic Club",note:"Left-footed centre-back who plays out from the back with composure. Organises Spain's positional structure." },
    { n:2,  name:"Porro",       full:"Pedro Porro",         pos:"DF", slotRole:"RB",  club:"Tottenham",    note:"Energetic right-back who attacks relentlessly. His overlapping runs and crosses create constant danger." },
    { n:8,  name:"Pedri",       full:"Pedri González",      pos:"MF", slotRole:"LCM", club:"Barcelona",    note:"Spain's metronome. Receives under pressure and immediately finds the next pass. Scanning frequency elite." },
    { n:6,  name:"Rodri",       full:"Rodri Hernández",     pos:"MF", slotRole:"CM",  club:"Man City",     note:"The best defensive midfielder in the world. Controls games through positioning and interception, not just tackling." },
    { n:10, name:"Fabián Ruiz", full:"Fabián Ruiz",         pos:"MF", slotRole:"RCM", club:"PSG",          note:"Elegant left-footed midfielder. Finds pockets of space and switches play with effortless long diagonal passes." },
    { n:11, name:"L. Yamal",    full:"Lamine Yamal",        pos:"FW", slotRole:"LW",  club:"Barcelona",    note:"The most exciting teenager in world football. Takes on defenders at pace with devastating directness." },
    { n:9,  name:"Oyarzabal",   full:"Mikel Oyarzabal",     pos:"FW", slotRole:"ST",  club:"R. Sociedad",  note:"Composed technical striker who drops deep and links play. Clinical finisher on both feet in the box." },
    { n:17, name:"N. Williams", full:"Nico Williams",       pos:"FW", slotRole:"RW",  club:"Athletic Club",note:"Electric winger who complements Yamal perfectly. Direct, fearless, and quick on the opposite flank." },
  ], bench: [
    {n:12,name:"David Raya",  pos:"GK",club:"Arsenal"},     {n:13,name:"Joan García", pos:"GK",club:"Barcelona"},
    {n:5, name:"Cucurella",   pos:"DF",club:"Chelsea"},     {n:7, name:"Merino",      pos:"MF",club:"Arsenal"},
    {n:15,name:"Zubimendi",   pos:"MF",club:"Arsenal"},     {n:16,name:"Gavi",        pos:"MF",club:"Barcelona"},
    {n:18,name:"Dani Olmo",   pos:"FW",club:"Barcelona"},   {n:19,name:"Ferran Torres",pos:"FW",club:"Barcelona"},
    {n:20,name:"Yeremy Pino", pos:"FW",club:"C. Palace"},
  ]},

  ger: { defaultFormation: "4-2-3-1", starters: [
    { n:1,  name:"Neuer",       full:"Manuel Neuer",        pos:"GK", slotRole:"GK",  club:"Bayern",       note:"The sweeper-keeper concept personified. Rushes off his line and commands the box with legendary authority." },
    { n:3,  name:"Raum",        full:"David Raum",          pos:"DF", slotRole:"LB",  club:"RB Leipzig",   note:"Attacking left-back who pushes high to overload the left side and deliver crosses into the penalty area." },
    { n:5,  name:"Schlotterbeck",full:"Nico Schlotterbeck", pos:"DF", slotRole:"CB",  club:"Dortmund",     note:"Left-footed ball-playing centre-back. Steps out aggressively and starts attacks with progressive carries." },
    { n:2,  name:"Rüdiger",     full:"Antonio Rüdiger",     pos:"DF", slotRole:"CB",  club:"Real Madrid",  note:"Intimidating and physically dominant. Provides leadership and raw aggression at the heart of Germany's defence." },
    { n:4,  name:"N. Brown",    full:"Nathaniel Brown",     pos:"DF", slotRole:"RB",  club:"Frankfurt",    note:"Young right-back with pace and composure in transition. Supports attacks while maintaining defensive discipline." },
    { n:6,  name:"Kimmich",     full:"Joshua Kimmich",      pos:"MF", slotRole:"DM",  club:"Bayern",       note:"World-class defensive midfielder. Reads play brilliantly, presses with intensity, passes with precision." },
    { n:14, name:"Pavlovic",    full:"Aleksandar Pavlovic", pos:"MF", slotRole:"DM",  club:"Bayern",       note:"Highly rated young double-pivot partner for Kimmich. Protects the back four and recycles possession efficiently." },
    { n:8,  name:"Wirtz",       full:"Florian Wirtz",       pos:"MF", slotRole:"LAM", club:"Liverpool",    note:"Germany's most technically gifted player. Creates from the left half-space with dribbles and key passes." },
    { n:10, name:"Musiala",     full:"Jamal Musiala",       pos:"MF", slotRole:"CAM", club:"Bayern",       note:"Free-roaming number 10 who finds pockets between the lines. Dribbles with ease in the tightest spaces." },
    { n:7,  name:"Sané",        full:"Leroy Sané",          pos:"FW", slotRole:"RAM", club:"Galatasaray",  note:"Lightning-quick winger who drifts from right to left. Terrifying in 1v1 and clinical in front of goal." },
    { n:9,  name:"Havertz",     full:"Kai Havertz",         pos:"FW", slotRole:"ST",  club:"Arsenal",      note:"Tall, technically exceptional striker. Reads the game like a midfielder and finishes with top-level composure." },
  ], bench: [
    {n:12,name:"Baumann",     pos:"GK",club:"Hoffenheim"},  {n:23,name:"Nübel",       pos:"GK",club:"Bayern"},
    {n:15,name:"Anton",       pos:"DF",club:"Dortmund"},    {n:16,name:"Tah",         pos:"DF",club:"Bayern"},
    {n:17,name:"Goretzka",    pos:"MF",club:"Bayern"},      {n:11,name:"Leweling",    pos:"MF",club:"Stuttgart"},
    {n:18,name:"Beier",       pos:"FW",club:"Dortmund"},    {n:19,name:"Undav",       pos:"FW",club:"Stuttgart"},
    {n:20,name:"Woltemade",   pos:"FW",club:"Newcastle"},
  ]},

  eng: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Pickford",    full:"Jordan Pickford",     pos:"GK", slotRole:"GK",  club:"Everton",      note:"England's reliable first choice. Elite shot-stopping reflexes and improved significantly with his feet." },
    { n:3,  name:"N. O'Reilly", full:"Nico O'Reilly",       pos:"DF", slotRole:"LB",  club:"Man City",     note:"Young left-back with technical quality and attacking instincts. Part of a bold new generation for England." },
    { n:6,  name:"Guehi",       full:"Marc Guéhi",          pos:"DF", slotRole:"CB",  club:"Man City",     note:"Calm, composed centre-back who plays out from the back. Rarely caught in possession under pressure." },
    { n:5,  name:"Stones",      full:"John Stones",         pos:"DF", slotRole:"CB",  club:"Man City",     note:"Ball-playing centre-back who drifts into midfield. Architect of England's build-up from the back." },
    { n:2,  name:"R. James",    full:"Reece James",         pos:"DF", slotRole:"RB",  club:"Chelsea",      note:"Dynamic attacking right-back whose delivery from wide positions is among the best in the world." },
    { n:4,  name:"Rice",        full:"Declan Rice",         pos:"MF", slotRole:"LCM", club:"Arsenal",      note:"Engine of England's midfield. Works tirelessly, protects the defence, and drives play forward constantly." },
    { n:10, name:"Bellingham",  full:"Jude Bellingham",     pos:"MF", slotRole:"CM",  club:"Real Madrid",  note:"England's talisman. Late runs, leadership, dribbling — complete midfielder with a big-game mentality." },
    { n:8,  name:"Mainoo",      full:"Kobbie Mainoo",       pos:"MF", slotRole:"RCM", club:"Man United",   note:"Naturally gifted ball-carrying midfielder. Stays calm under pressure and unlocks defences with smart passes." },
    { n:7,  name:"Saka",        full:"Bukayo Saka",         pos:"FW", slotRole:"LW",  club:"Arsenal",      note:"Drifts inside from the right to create and score. One of the world's best at exploiting half-spaces." },
    { n:9,  name:"Kane",        full:"Harry Kane",          pos:"FW", slotRole:"ST",  club:"Bayern",       note:"England's all-time top scorer. Drops deep to link play and arrives in the box with lethal timing." },
    { n:11, name:"Gordon",      full:"Anthony Gordon",      pos:"FW", slotRole:"RW",  club:"Barcelona",    note:"Direct left winger who runs at defenders. Energetic, powerful, and dangerous with an eye for the spectacular." },
  ], bench: [
    {n:12,name:"D. Henderson",pos:"GK",club:"C. Palace"},   {n:13,name:"Trafford",    pos:"GK",club:"Man City"},
    {n:14,name:"Konsa",       pos:"DF",club:"Aston Villa"}, {n:16,name:"Quansah",     pos:"DF",club:"Leverkusen"},
    {n:17,name:"Rogers",      pos:"MF",club:"Aston Villa"}, {n:18,name:"Eze",         pos:"MF",club:"Arsenal"},
    {n:19,name:"Watkins",     pos:"FW",club:"Aston Villa"}, {n:20,name:"Toney",       pos:"FW",club:"Al-Ahli"},
    {n:21,name:"Madueke",     pos:"FW",club:"Arsenal"},
  ]},

  usa: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Turner",      full:"Matt Turner",          pos:"GK", slotRole:"GK",  club:"New England",  note:"Strong positional goalkeeper who sweeps well. Brings confidence and presence to the USMNT backline." },
    { n:3,  name:"A. Robinson", full:"Antonee Robinson",     pos:"DF", slotRole:"LB",  club:"Fulham",       note:"Pacey left-back known as 'Jedi'. Covers huge ground, attacks down the left, and never stops running." },
    { n:6,  name:"McKenzie",    full:"Mark McKenzie",        pos:"DF", slotRole:"CB",  club:"Toulouse",     note:"Aerial dominant centre-back who communicates well and organises the defensive structure effectively." },
    { n:15, name:"Richards",    full:"Chris Richards",       pos:"DF", slotRole:"CB",  club:"Crystal Palace",note:"Composed ball-playing defender who is at home stepping out with the ball from the back." },
    { n:2,  name:"Dest",        full:"Sergiño Dest",         pos:"DF", slotRole:"RB",  club:"PSV",          note:"Technical and attack-minded right-back who loves 1v1 situations and creating overloads on the right." },
    { n:8,  name:"McKennie",    full:"Weston McKennie",      pos:"MF", slotRole:"LCM", club:"Juventus",     note:"Physical box-to-box midfielder who crashes into the box late. Strong in the air and in the tackle." },
    { n:4,  name:"T. Adams",    full:"Tyler Adams",          pos:"MF", slotRole:"CM",  club:"Bournemouth",  note:"USA captain and heartbeat of the midfield. Breaks up play, covers gaps, and leads by example every game." },
    { n:7,  name:"Reyna",       full:"Gio Reyna",            pos:"MF", slotRole:"RCM", club:"Dortmund",     note:"Creative, technical midfielder. When fit, his dribbling and through-balls unlock any defence with ease." },
    { n:17, name:"Weah",        full:"Tim Weah",             pos:"FW", slotRole:"LW",  club:"Marseille",    note:"Dynamic right winger with pace and directness. Son of George Weah and a real game-changer in wide areas." },
    { n:9,  name:"Balogun",     full:"Folarin Balogun",      pos:"FW", slotRole:"ST",  club:"Monaco",       note:"Explosive striker with a clinical edge. Holds up play effectively and scores with head and both feet." },
    { n:10, name:"Pulisic",     full:"Christian Pulisic",    pos:"FW", slotRole:"RW",  club:"AC Milan",     note:"Captain America. Drifts inside from the right to shoot or combine. Relentless and inspired in big moments." },
  ], bench: [
    {n:12,name:"Freese",      pos:"GK",club:"NYCFC"},        {n:23,name:"Brady",       pos:"GK",club:"Chicago Fire"},
    {n:5, name:"Ream",        pos:"DF",club:"Charlotte FC"}, {n:13,name:"Trusty",      pos:"DF",club:"Celtic"},
    {n:14,name:"Scally",      pos:"DF",club:"M'gladbach"},   {n:16,name:"Rollán",      pos:"MF",club:"Seattle"},
    {n:18,name:"Tillman",     pos:"MF",club:"Leverkusen"},   {n:11,name:"Aaronson",    pos:"FW",club:"Leeds"},
    {n:19,name:"Pepi",        pos:"FW",club:"PSV"},
  ]},

  por: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Diogo Costa", full:"Diogo Costa",          pos:"GK", slotRole:"GK",  club:"FC Porto",     note:"Technically excellent goalkeeper with superb feet. Has taken over from Rui Patrício with full authority." },
    { n:25, name:"Nuno Mendes", full:"Nuno Mendes",          pos:"DF", slotRole:"LB",  club:"PSG",          note:"Pacey, technical left-back. Exceptional in 1v1 defending and drives forward to support attacks with quality." },
    { n:3,  name:"Rúben Dias",  full:"Rúben Dias",           pos:"DF", slotRole:"CB",  club:"Man City",     note:"Elite centre-back. Dominant in the air, reads danger early, and passes with the quality of a top midfielder." },
    { n:4,  name:"Tomás Araújo",full:"Tomás Araújo",         pos:"DF", slotRole:"CB",  club:"Benfica",      note:"Young centre-back with composure beyond his years. Solid partner for Dias and excellent on the ball." },
    { n:20, name:"Cancelo",     full:"João Cancelo",         pos:"DF", slotRole:"RB",  club:"Barcelona",    note:"Versatile, attacking full-back who inverts into midfield. One of the best crossers in world football." },
    { n:8,  name:"B. Fernandes",full:"Bruno Fernandes",      pos:"MF", slotRole:"LCM", club:"Man United",   note:"Drives forward relentlessly, scores or assists in almost every game. Portugal's creative heartbeat." },
    { n:15, name:"João Neves",  full:"João Neves",           pos:"MF", slotRole:"CM",  club:"PSG",          note:"Brilliant young midfielder with elite passing range and high defensive work rate. Portugal's future star." },
    { n:23, name:"Vitinha",     full:"Vitinha",              pos:"MF", slotRole:"RCM", club:"PSG",          note:"Technically gifted ball-player. Keeps the tempo of play and finds passing angles that others simply don't see." },
    { n:11, name:"João Félix",  full:"João Félix",           pos:"FW", slotRole:"LW",  club:"Al-Nassr",     note:"Gifted, graceful attacker who cuts inside and creates. Excellent link play and a powerful long-range shot." },
    { n:9,  name:"G. Ramos",    full:"Gonçalo Ramos",        pos:"FW", slotRole:"ST",  club:"PSG",          note:"Hat-trick hero of Qatar 2022. Powerful striker with aerial ability and goals from outside the box." },
    { n:7,  name:"Ronaldo",     full:"Cristiano Ronaldo",    pos:"FW", slotRole:"RW",  club:"Al-Nassr",     note:"At 41, still world-class. The all-time leading goal-scorer in men's football makes history at his sixth World Cup." },
  ], bench: [
    {n:12,name:"José Sá",     pos:"GK",club:"Wolves"},       {n:22,name:"Rui Silva",   pos:"GK",club:"Sporting CP"},
    {n:5, name:"Dalot",       pos:"DF",club:"Man United"},   {n:13,name:"Renato Veiga",pos:"DF",club:"Villarreal"},
    {n:10,name:"Bernardo",    pos:"MF",club:"Man City"},     {n:21,name:"R. Neves",    pos:"MF",club:"Al-Hilal"},
    {n:17,name:"Rafael Leão", pos:"FW",club:"AC Milan"},     {n:18,name:"Pedro Neto",  pos:"FW",club:"Chelsea"},
    {n:19,name:"G. Guedes",   pos:"FW",club:"R. Sociedad"},
  ]},

  mex: { defaultFormation: "4-3-3", starters: [
    { n:13, name:"Ochoa",       full:"Guillermo Ochoa",      pos:"GK", slotRole:"GK",  club:"Salernitana",  note:"Legendary World Cup performer. Ageless reflexes and clutch saves on the biggest stage." },
    { n:23, name:"Gallardo",    full:"Jesús Gallardo",       pos:"DF", slotRole:"LB",  club:"Monterrey",    note:"Attacking left-back who provides constant overlapping runs." },
    { n:3,  name:"Montes",      full:"César Montes",         pos:"DF", slotRole:"CB",  club:"Almería",      note:"Tall and commanding centre-back, excellent in the air." },
    { n:4,  name:"Álvarez",     full:"Edson Álvarez",        pos:"DF", slotRole:"CB",  club:"West Ham",     note:"Versatile enforcer who drops from midfield to defence. True leader." },
    { n:19, name:"Sánchez",     full:"Jorge Sánchez",        pos:"DF", slotRole:"RB",  club:"Porto",        note:"Aggressive right-back with great pace." },
    { n:16, name:"Herrera",     full:"Héctor Herrera",       pos:"MF", slotRole:"LCM", club:"Houston",      note:"Veteran midfielder with great vision and passing range." },
    { n:18, name:"Guardado",    full:"Andrés Guardado",      pos:"MF", slotRole:"CM",  club:"León",         note:"Experienced captain who controls the tempo of the game." },
    { n:8,  name:"Rodríguez",   full:"Carlos Rodríguez",     pos:"MF", slotRole:"RCM", club:"Cruz Azul",    note:"Dynamic box-to-box midfielder." },
    { n:22, name:"Lozano",      full:"Hirving Lozano",       pos:"FW", slotRole:"LW",  club:"PSV",          note:"'Chucky' provides explosive pace and direct attacking threat." },
    { n:9,  name:"Jiménez",     full:"Raúl Jiménez",         pos:"FW", slotRole:"ST",  club:"Fulham",       note:"Complete forward with excellent link-up play." },
    { n:15, name:"Antuna",      full:"Uriel Antuna",         pos:"FW", slotRole:"RW",  club:"Cruz Azul",    note:"Pacey winger who stretches opposition defences." },
  ], bench: [
    {n:1, name:"Talavera",    pos:"GK",club:"Juárez"},       {n:12,name:"Cota",        pos:"GK",club:"León"},
    {n:5, name:"Vásquez",     pos:"DF",club:"Genoa"},        {n:6, name:"Arteaga",     pos:"DF",club:"Monterrey"},
    {n:7, name:"Romo",        pos:"MF",club:"Monterrey"},    {n:14,name:"Gutiérrez",   pos:"MF",club:"Chivas"},
    {n:10,name:"Vega",        pos:"FW",club:"Toluca"},       {n:11,name:"Funes Mori",  pos:"FW",club:"Pumas"},
    {n:17,name:"Pineda",      pos:"MF",club:"AEK Athens"},
  ]},

  can: { defaultFormation: "4-4-2", starters: [
    { n:1,  name:"Crepeau",     full:"Maxime Crépeau",       pos:"GK", slotRole:"GK",  club:"Portland",     note:"Reliable shot-stopper with great command of his area." },
    { n:19, name:"Davies",      full:"Alphonso Davies",      pos:"DF", slotRole:"LB",  club:"Bayern",       note:"World-class pace and dribbling. The absolute star of the team." },
    { n:4,  name:"Miller",      full:"Kamal Miller",         pos:"DF", slotRole:"CB",  club:"Portland",     note:"Solid defender with good distribution." },
    { n:5,  name:"Vitoria",     full:"Steven Vitória",       pos:"DF", slotRole:"CB",  club:"Chaves",       note:"Veteran presence at the back with physical dominance." },
    { n:2,  name:"Johnston",    full:"Alistair Johnston",    pos:"DF", slotRole:"RB",  club:"Celtic",       note:"Hard-tackling and energetic right-back." },
    { n:11, name:"Buchanan",    full:"Tajon Buchanan",       pos:"MF", slotRole:"LM",  club:"Inter Milan",  note:"Electric winger who takes players on directly." },
    { n:7,  name:"Eustáquio",   full:"Stephen Eustáquio",    pos:"MF", slotRole:"CM",  club:"Porto",        note:"The midfield metronome for Canada. Great passing range." },
    { n:8,  name:"Koné",        full:"Ismaël Koné",          pos:"MF", slotRole:"CM",  club:"Watford",      note:"Athletic and technical young midfielder." },
    { n:21, name:"Osorio",      full:"Jonathan Osorio",      pos:"MF", slotRole:"RM",  club:"Toronto FC",   note:"Experienced versatile midfielder with a knack for important goals." },
    { n:20, name:"David",       full:"Jonathan David",       pos:"FW", slotRole:"ST",  club:"Lille",        note:"Prolific goalscorer with great positioning." },
    { n:17, name:"Larin",       full:"Cyle Larin",           pos:"FW", slotRole:"ST",  club:"Mallorca",     note:"All-time top scorer for Canada. Strong and clinical." },
  ], bench: [
    {n:18,name:"Borjan",      pos:"GK",club:"Slovan"},       {n:16,name:"Dayne",       pos:"GK",club:"Minnesota"},
    {n:3, name:"Adekugbe",    pos:"DF",club:"Vancouver"},    {n:22,name:"Laryea",      pos:"DF",club:"Toronto FC"},
    {n:13,name:"Cornelius",   pos:"DF",club:"Malmö"},        {n:14,name:"Kaye",        pos:"MF",club:"New England"},
    {n:15,name:"Piette",      pos:"MF",club:"Montréal"},     {n:10,name:"Hoilett",     pos:"FW",club:"Aberdeen"},
    {n:9, name:"Cavallini",   pos:"FW",club:"Puebla"},
  ]},

  ned: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Verbruggen",  full:"Bart Verbruggen",      pos:"GK", slotRole:"GK",  club:"Brighton",     note:"Talented young keeper who replaced injured Flekken. Athletic with exceptional reflexes and great distribution." },
    { n:25, name:"Hato",        full:"Jorrel Hato",          pos:"DF", slotRole:"LB",  club:"Chelsea",      note:"Technical young left-back who stepped up impressively. Calm on the ball and adventurous going forward." },
    { n:4,  name:"Van Dijk",    full:"Virgil van Dijk",      pos:"DF", slotRole:"CB",  club:"Liverpool",    note:"Captain and one of the world's best centre-backs. Dominant physically and an inspirational leader." },
    { n:5,  name:"Aké",         full:"Nathan Aké",           pos:"DF", slotRole:"CB",  club:"Man City",     note:"Versatile, left-footed centre-back who also covers at left-back. Crucial for Netherlands' ball-playing." },
    { n:22, name:"Dumfries",    full:"Denzel Dumfries",      pos:"DF", slotRole:"RB",  club:"Inter Milan",  note:"Powerful, dynamic right-back who attacks relentlessly. Excellent aerial threat on crosses." },
    { n:8,  name:"Gravenberch", full:"Ryan Gravenberch",     pos:"MF", slotRole:"LCM", club:"Liverpool",    note:"Physically imposing midfielder who has blossomed at Liverpool. Carries the ball forward with ease." },
    { n:21, name:"F. de Jong",  full:"Frenkie de Jong",      pos:"MF", slotRole:"CM",  club:"Barcelona",    note:"Orchestrates from deep, drives forward with the ball, and switches play with pinpoint diagonal passes." },
    { n:14, name:"Reijnders",   full:"Tijjani Reijnders",    pos:"MF", slotRole:"RCM", club:"Man City",     note:"Dynamic goal-scoring midfielder who arrives late into the box. Technical and tireless in equal measure." },
    { n:11, name:"Gakpo",       full:"Cody Gakpo",           pos:"FW", slotRole:"LW",  club:"Liverpool",    note:"Versatile attacker who operates left or through the middle. Excellent finisher with both feet." },
    { n:9,  name:"Weghorst",    full:"Wout Weghorst",        pos:"FW", slotRole:"ST",  club:"Ajax",         note:"Target man who holds up play, wins aerial duels, and unsettles defences with intelligent movement." },
    { n:10, name:"Memphis",     full:"Memphis Depay",        pos:"FW", slotRole:"RW",  club:"Corinthians",  note:"Experienced attacker returning from injury. Unpredictable, direct, and capable of producing moments of brilliance." },
  ], bench: [
    {n:23,name:"Flekken",     pos:"GK",club:"Leverkusen"},   {n:13,name:"Roefs",       pos:"GK",club:"Sunderland"},
    {n:2, name:"Geertruida",  pos:"DF",club:"Sunderland"},   {n:6, name:"Van Hecke",   pos:"DF",club:"Brighton"},
    {n:3, name:"De Roon",     pos:"MF",club:"Atalanta"},     {n:20,name:"Koopmeiners", pos:"MF",club:"Juventus"},
    {n:17,name:"Noa Lang",    pos:"FW",club:"Galatasaray"},  {n:18,name:"Malen",       pos:"FW",club:"Roma"},
    {n:19,name:"Brobbey",     pos:"FW",club:"Sunderland"},
  ]},

  mor: { defaultFormation: "4-3-3", starters: [
    { n:1,  name:"Bounou",      full:"Yassine Bounou",       pos:"GK", slotRole:"GK",  club:"Al-Hilal",     note:"Hero of Qatar 2022 semi-final. Commanding presence who makes difficult saves look completely routine." },
    { n:3,  name:"Mazraoui",    full:"Noussair Mazraoui",    pos:"DF", slotRole:"LB",  club:"Man United",   note:"Versatile defender who can play right or left. Technical and attack-minded with an energetic, direct style." },
    { n:5,  name:"Riad",        full:"Chadi Riad",           pos:"DF", slotRole:"CB",  club:"Crystal Palace",note:"Young centre-back impressing with composure and reading of the game. Strong in the tackle." },
    { n:4,  name:"Issa Diop",   full:"Issa Diop",            pos:"DF", slotRole:"CB",  club:"Fulham",       note:"Tall, physical centre-back who wins headers and organises Morocco's defensive shape with authority." },
    { n:2,  name:"Hakimi",      full:"Achraf Hakimi",        pos:"DF", slotRole:"RB",  club:"PSG",          note:"World-class attacking right-back. Explosive pace, brilliant crossing, and elite 1v1 defending when called upon." },
    { n:6,  name:"Amrabat",     full:"Sofyan Amrabat",       pos:"MF", slotRole:"LCM", club:"Real Betis",   note:"The warrior of Qatar 2022. Covers every blade of grass, protects the defence, and inspires the whole team." },
    { n:7,  name:"Bouaddi",     full:"Ayyoub Bouaddi",       pos:"MF", slotRole:"CM",  club:"Lille",        note:"18-year-old phenom making his World Cup debut. Quick, decisive passing and reads the game beyond his years." },
    { n:8,  name:"El Khannouss",full:"Bilal El Khannouss",   pos:"MF", slotRole:"RCM", club:"Stuttgart",    note:"Creative and direct midfield presence. Links midfield and attack with clever dribbling and sharp passing." },
    { n:10, name:"Ounahi",      full:"Azzedine Ounahi",      pos:"FW", slotRole:"LW",  club:"Girona",       note:"Creative player who drifts wide and dribbles past opponents with energy and imagination." },
    { n:9,  name:"El Aynaoui",  full:"Neil El Aynaoui",      pos:"FW", slotRole:"ST",  club:"AS Roma",      note:"Physical and mobile forward who leads the press and holds up play well. Scores important goals." },
    { n:11, name:"Saibari",     full:"Ismael Saibari",       pos:"FW", slotRole:"RW",  club:"PSV",          note:"Tireless right-sided attacker who tracks back diligently. Dynamic in transition and direct in attack." },
  ], bench: [
    {n:12,name:"Mohamedi",    pos:"GK",club:"Berkane"},      {n:13,name:"Tagnaouti",   pos:"GK",club:"AS FAR"},
    {n:14,name:"El Ouahdi",   pos:"DF",club:"KRC Genk"},     {n:15,name:"Halhal",      pos:"DF",club:"Mechelen"},
    {n:16,name:"Talbi",       pos:"MF",club:"Sunderland"},   {n:17,name:"El Mourabet", pos:"MF",club:"Strasbourg"},
    {n:18,name:"Saâdane",     pos:"DF",club:"Al-Fateh"},     {n:19,name:"Salah-Eddine",pos:"DF",club:"PSV"},
  ]},
};

/* ─── Tactical formation positions ──────────────────────── */
const FORMATION_DATA: Record<string, { label: string; desc: string; positions: PosItem[] }> = {
  "4-3-3": { label:"4-3-3", desc:"High pressing, possession-based football. Wingers provide width and cut inside, while the front three press relentlessly to win the ball high up the pitch.",
    positions:[
      {n:1,role:"GK", x:50,y:133},{n:2,role:"LB",  x:15,y:112},{n:3,role:"CB", x:36,y:108},{n:4,role:"CB",  x:64,y:108},{n:5,role:"RB",  x:85,y:112},
      {n:6,role:"LCM",x:25,y:83 },{n:7,role:"CM",  x:50,y:80 },{n:8,role:"RCM",x:75,y:83 },{n:9,role:"LW", x:18,y:45 },{n:10,role:"ST",x:50,y:40 },{n:11,role:"RW",x:82,y:45 },
    ]},
  "4-4-2": { label:"4-4-2", desc:"A balanced, classic shape. Two banks of four give defensive solidity and width, while two strikers share goal-scoring duty. Easy to understand, hard to break down.",
    positions:[
      {n:1,role:"GK",x:50,y:133},{n:2,role:"LB",x:14,y:112},{n:3,role:"CB",x:36,y:108},{n:4,role:"CB",x:64,y:108},{n:5,role:"RB",x:86,y:112},
      {n:6,role:"LM",x:11,y:82},{n:7,role:"CM",x:37,y:79},{n:8,role:"CM",x:63,y:79},{n:9,role:"RM",x:89,y:82},{n:10,role:"ST",x:36,y:44},{n:11,role:"ST",x:64,y:44},
    ]},
  "4-2-3-1": { label:"4-2-3-1", desc:"A modern system built on defensive solidity and fast transitions. The double pivot shields the back four while the free-roaming number 10 creates overloads in the final third.",
    positions:[
      {n:1,role:"GK",x:50,y:133},{n:2,role:"LB",x:14,y:112},{n:3,role:"CB",x:36,y:108},{n:4,role:"CB",x:64,y:108},{n:5,role:"RB",x:86,y:112},
      {n:6,role:"DM",x:36,y:90},{n:7,role:"DM",x:64,y:90},{n:8,role:"LAM",x:18,y:67},{n:9,role:"CAM",x:50,y:63},{n:10,role:"RAM",x:82,y:67},{n:11,role:"ST",x:50,y:40},
    ]},
  "3-5-2": { label:"3-5-2", desc:"Wing-backs dominate wide areas while three centre-backs provide structural solidity. Five midfielders control the game, freeing two strikers to focus purely on finishing.",
    positions:[
      {n:1,role:"GK",x:50,y:133},{n:2,role:"CB",x:25,y:112},{n:3,role:"CB",x:50,y:108},{n:4,role:"CB",x:75,y:112},
      {n:5,role:"LWB",x:9,y:82},{n:6,role:"LCM",x:32,y:80},{n:7,role:"CM",x:50,y:77},{n:8,role:"RCM",x:68,y:80},{n:9,role:"RWB",x:91,y:82},
      {n:10,role:"ST",x:36,y:44},{n:11,role:"ST",x:64,y:44},
    ]},
};

/* ─── Country list for tactical screen ──────────────────── */
const COUNTRIES = [
  {id:"bra",name:"Brazil",      flag:"🇧🇷"},{id:"arg",name:"Argentina",   flag:"🇦🇷"},
  {id:"fra",name:"France",      flag:"🇫🇷"},{id:"esp",name:"Spain",        flag:"🇪🇸"},
  {id:"ger",name:"Germany",     flag:"🇩🇪"},{id:"eng",name:"England",      flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
  {id:"usa",name:"USA",         flag:"🇺🇸"},{id:"por",name:"Portugal",     flag:"🇵🇹"},
  {id:"ned",name:"Netherlands", flag:"🇳🇱"},{id:"mor",name:"Morocco",      flag:"🇲🇦"},
];

/* ─── Roster static data ─────────────────────────────────── */
const TEAMS = [
  {id:"all",name:"All Teams",flag:"🌍"},{id:"usa",name:"USA",flag:"🇺🇸"},{id:"mex",name:"Mexico",flag:"🇲🇽"},
  {id:"can",name:"Canada",flag:"🇨🇦"},{id:"bra",name:"Brazil",flag:"🇧🇷"},{id:"arg",name:"Argentina",flag:"🇦🇷"},
  {id:"ger",name:"Germany",flag:"🇩🇪"},{id:"esp",name:"Spain",flag:"🇪🇸"},{id:"fra",name:"France",flag:"🇫🇷"},
  {id:"eng",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{id:"ned",name:"Netherlands",flag:"🇳🇱"},{id:"por",name:"Portugal",flag:"🇵🇹"},
  {id:"mor",name:"Morocco",flag:"🇲🇦"},{id:"nor",name:"Norway",flag:"🇳🇴"},
];
const FAVE_TEAMS = ["usa","mex","can","bra","arg","esp"];

const HARDCODED_PLAYERS: Player[] = [
  {id:1, name:"Lionel Messi",     abbr:"LM",pos:"FWD",team:"arg",flag:"🇦🇷",rating:91,pac:85,sho:92,pas:91,dri:95,def:38,phy:65,role:"Free Roaming Forward",     tactical:"Drops deep to receive, initiates transitions from the half-space. Overloads the right flank to create 2v1s.",watch:"Diagonal runs from wide right into the box. Watch how he times his movement to ghost past the offside trap."},
  {id:2, name:"Kylian Mbappé",    abbr:"KM",pos:"FWD",team:"fra",flag:"🇫🇷",rating:93,pac:97,sho:88,pas:78,dri:92,def:36,phy:78,role:"Centre Forward",            tactical:"Stretches defensive lines vertically. Presses high to force turnovers and pounce on loose balls.",watch:"Track his runs in behind — he times them perfectly against high defensive lines."},
  {id:3, name:"Erling Haaland",   abbr:"EH",pos:"FWD",team:"nor",flag:"🇳🇴",rating:91,pac:89,sho:94,pas:66,dri:80,def:44,phy:91,role:"Target Striker",            tactical:"Occupies both centre-backs, pins the defensive line, and attacks wide crosses with ferocity.",watch:"His near-post movement on wide deliveries — the timing and physicality is elite."},
  {id:4, name:"Vinícius Jr.",     abbr:"VJ",pos:"FWD",team:"bra",flag:"🇧🇷",rating:89,pac:95,sho:80,pas:75,dri:93,def:28,phy:68,role:"Inverted Winger",           tactical:"Cuts inside from the left onto his right foot, creating diagonal shooting lanes.",watch:"One-on-one duels at pace — he wins 68% of his dribbles against back-pedalling defenders."},
  {id:5, name:"Pedri González",   abbr:"PG",pos:"MID",team:"esp",flag:"🇪🇸",rating:87,pac:72,sho:74,pas:88,dri:86,def:72,phy:64,role:"Interior Midfielder",       tactical:"Third-man combinations and positional rotations inside the 8-zone. Connects lines between the pivot and trident.",watch:"His scanning frequency — averaging 3.1 head-checks per possession."},
  {id:6, name:"Frenkie de Jong",  abbr:"FD",pos:"MID",team:"ned",flag:"🇳🇱",rating:85,pac:76,sho:68,pas:87,dri:84,def:76,phy:77,role:"Deep-Lying Playmaker",     tactical:"Ball carrier from deep who drives through midfield press lines. Switches play with diagonal long passes.",watch:"How he invites pressure then releases late — creating pockets for Netherlands' wingers."},
  {id:7, name:"Jude Bellingham",  abbr:"JB",pos:"MID",team:"eng",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",rating:88,pac:78,sho:83,pas:84,dri:88,def:80,phy:84,role:"Box-to-Box Midfielder",    tactical:"Arrives late into the penalty area from deep midfield runs. High pressing intensity from midfield positions.",watch:"His late runs from the right half-space — arriving just as the ball enters the penalty area."},
  {id:8, name:"Rodri Hernández",  abbr:"RH",pos:"MID",team:"esp",flag:"🇪🇸",rating:90,pac:66,sho:70,pas:88,dri:78,def:88,phy:86,role:"Defensive Midfielder",      tactical:"Screens the back four, breaks up transitions, and recycles possession under intense pressure.",watch:"His positioning whenever Spain lose the ball — almost always between the ball and the goal."},
  {id:9, name:"Rúben Dias",       abbr:"RD",pos:"DEF",team:"por",flag:"🇵🇹",rating:88,pac:74,sho:45,pas:72,dri:60,def:90,phy:85,role:"Ball-Playing Centre-Back",  tactical:"Steps out aggressively to press and starts attacks from the back with progressive carries.",watch:"Aerial dominance at set pieces — Portugal rely on him for both boxes."},
  {id:10,name:"Achraf Hakimi",    abbr:"AH",pos:"DEF",team:"mor",flag:"🇲🇦",rating:85,pac:92,sho:64,pas:76,dri:82,def:76,phy:74,role:"Attacking Full-Back",       tactical:"Overlaps to the byline and delivers early crosses. Provides width when midfield compresses centrally.",watch:"Inside runs when the winger cuts in — creates natural 2v1 overloads on Morocco's right channel."},
  {id:11,name:"Christian Pulisic",abbr:"CP",pos:"FWD",team:"usa",flag:"🇺🇸",rating:81,pac:85,sho:78,pas:76,dri:84,def:44,phy:66,role:"Attacking Midfielder",      tactical:"Operates in pockets between the lines. Drifts wide right to overload USA's primary attacking corridor.",watch:"Off-ball movement the instant USA win possession — immediately scans and bursts into space."},
  {id:12,name:"Alphonso Davies",  abbr:"AD",pos:"DEF",team:"can",flag:"🇨🇦",rating:83,pac:96,sho:60,pas:74,dri:85,def:72,phy:70,role:"Marauding Left-Back",       tactical:"Bomb-forward full-back who becomes Canada's left winger in possession.",watch:"His recovery runs — pure acceleration saves Canada multiple goals per tournament."},
  {id:13,name:"Lamine Yamal",     abbr:"LY",pos:"FWD",team:"esp",flag:"🇪🇸",rating:86,pac:91,sho:82,pas:80,dri:90,def:30,phy:62,role:"Right Winger",              tactical:"Takes defenders on with relentless directness from the right channel.",watch:"His ability to beat the first man and immediately play a combination — devastating."},
  {id:14,name:"Bukayo Saka",      abbr:"BS",pos:"FWD",team:"eng",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",rating:85,pac:88,sho:80,pas:82,dri:86,def:55,phy:68,role:"Versatile Winger",          tactical:"Drifts inside from the right to combine or arrive for shots from range.",watch:"How he exploits half-spaces when opposition defenders have tired legs."},
  {id:15,name:"Raphinha",         abbr:"RA",pos:"FWD",team:"bra",flag:"🇧🇷",rating:84,pac:86,sho:82,pas:78,dri:87,def:38,phy:66,role:"Right Winger",              tactical:"Consistent width and directness from Brazil's right flank.",watch:"Free-kick delivery — his technique at set pieces is genuinely world-class."},
  {id:16,name:"Jamal Musiala",    abbr:"JM",pos:"MID",team:"ger",flag:"🇩🇪",rating:87,pac:82,sho:80,pas:83,dri:89,def:60,phy:68,role:"Advanced Playmaker",        tactical:"Operates freely between the lines with quick one-touch combinations.",watch:"His movement to find pockets between the opposition midfield and defence."},
  {id:17,name:"Alphonso Davies",  abbr:"AD",pos:"DEF",team:"can",flag:"🇨🇦",rating:85,pac:95,sho:68,pas:78,dri:84,def:76,phy:77,role:"Attacking Wing-Back",       tactical:"Explosive pace on the left flank.",watch:"Recovery runs and overlapping sprints."},
  {id:18,name:"Guillermo Ochoa",  abbr:"GO",pos:"GK",team:"mex",flag:"🇲🇽",rating:82,pac:50,sho:30,pas:60,dri:50,def:84,phy:70,role:"Shot Stopper",                tactical:"Commands the box and thrives under World Cup pressure.",watch:"Unreal reflexes on the goal line."},
  {id:19,name:"Hirving Lozano",   abbr:"HL",pos:"FWD",team:"mex",flag:"🇲🇽",rating:82,pac:90,sho:78,pas:75,dri:83,def:40,phy:65,role:"Inverted Winger",           tactical:"Cuts inside onto his right foot from the left.",watch:"Direct running at retreating defenders."},
  {id:20,name:"Jonathan David",   abbr:"JD",pos:"FWD",team:"can",flag:"🇨🇦",rating:82,pac:84,sho:82,pas:75,dri:80,def:40,phy:72,role:"Complete Forward",          tactical:"Links play and finds spaces in the box.",watch:"Intelligent off-ball movement in the final third."},
];

const DYNAMIC_PLAYERS: Player[] = [];
const seenIds = new Set<string>();
const countryMap: Record<string, string> = {
  "Argentina": "arg", "France": "fra", "Germany": "ger", "Spain": "esp",
  "England": "eng", "USA": "usa", "Portugal": "por", "Netherlands": "ned",
  "Morocco": "mor", "Brazil": "bra", "Mexico": "mex", "Canada": "can", "Norway": "nor"
};

wc2022Data.forEach((match: any) => {
  if (match.players) {
    match.players.forEach((p: any) => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        const teamId = countryMap[p.team] || "usa";
        const flag = COUNTRIES.find(c => c.id === teamId)?.flag || "🌍";
        
        DYNAMIC_PLAYERS.push({
          id: parseInt(p.id) || Math.floor(Math.random() * 100000) + 1000,
          name: p.name,
          abbr: p.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
          pos: p.position.includes("Midfield") ? "MID" : p.position.includes("Back") ? "DEF" : p.position.includes("Goal") ? "GK" : "FWD",
          team: teamId,
          flag: flag,
          rating: Math.min(99, Math.round(75 + p.radar.reduce((a: number,b: number)=>a+b,0))),
          pac: Math.min(99, Math.round(70 + p.radar[0]*2)),
          sho: Math.min(99, Math.round(70 + p.radar[1]*2)),
          pas: Math.min(99, Math.round(70 + p.radar[2]*2)),
          dri: Math.min(99, Math.round(70 + p.radar[3]*2)),
          def: Math.min(99, Math.round(70 + p.radar[4]*2)),
          phy: Math.min(99, Math.round(70 + p.radar[5]*2)),
          role: p.position,
          tactical: "Imported from Qatar 2022 dataset.",
          watch: "A key player from the 2022 tournament."
        });
      }
    });
  }
});

const PLAYERS: Player[] = [...HARDCODED_PLAYERS, ...DYNAMIC_PLAYERS.filter(dp => !HARDCODED_PLAYERS.some(hp => hp.name === dp.name))];

const QUIZ_QUESTIONS = [
  { question:"Which nation has appeared in the most FIFA World Cup finals in history?",                  options:["Brazil","Germany","Italy","Argentina"],               correct:1, explanation:"Germany has appeared in 8 World Cup finals — the most of any nation in tournament history." },
  { question:"Who holds the all-time record for most goals scored across all World Cup tournaments?",    options:["Ronaldo (Brazil)","Pelé","Miroslav Klose","Gerd Müller"], correct:2, explanation:"Miroslav Klose (Germany) scored 16 goals across 4 World Cups (2002–2014), the all-time record." },
  { question:"How many nations will compete in the expanded 2026 FIFA World Cup?",                      options:["32","40","48","64"],                                  correct:2, explanation:"The 2026 World Cup expands to 48 teams — up from 32 in all previous editions." },
  { question:"Which country hosted and won the inaugural FIFA World Cup in 1930?",                       options:["Brazil","Argentina","Uruguay","Italy"],               correct:2, explanation:"Uruguay hosted and won the first World Cup in 1930, defeating Argentina 4-2 in the final." },
  { question:"How many goals did Kylian Mbappé score in the 2022 Qatar World Cup Final?",               options:["1","2","3","4"],                                      correct:2, explanation:"Mbappé's hat-trick at 80', 81', and 118' levelled it at 3-3, but France lost on penalties." },
];

/* ─── Mini Pitch (dashboard preview) ────────────────────── */
function TacticalPitchMini() {
  const dots=[{x:50,y:88,n:"GK"},{x:18,y:71,n:"LB"},{x:36,y:69,n:"CB"},{x:64,y:69,n:"CB"},{x:82,y:71,n:"RB"},{x:24,y:50,n:"LM"},{x:50,y:47,n:"CM"},{x:76,y:50,n:"RM"},{x:20,y:22,n:"LW"},{x:50,y:18,n:"ST"},{x:80,y:22,n:"RW"}];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity="0.2"/><stop offset="100%" stopColor={C.red} stopOpacity="0"/></linearGradient>
        <radialGradient id="dGm" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ff5a60"/><stop offset="100%" stopColor={C.red}/></radialGradient>
      </defs>
      {[0,1,2,3,4].map(i=><rect key={i} x={0} y={i*20} width={100} height={10} fill={i%2===0?"#0A2E16":"#0d3b1e"}/>)}
      <rect x={2.5} y={1.5} width={95} height={97} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={0.7} rx={1}/>
      <line x1={2.5} y1={50} x2={97.5} y2={50} stroke="rgba(255,255,255,0.18)" strokeWidth={0.5}/>
      <circle cx={50} cy={50} r={11} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5}/>
      <rect x={21} y={1.5} width={58} height={20} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5}/>
      <rect x={33} y={1.5} width={34} height={8} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5}/>
      <rect x={21} y={78.5} width={58} height={20} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5}/>
      <rect x={33} y={90.5} width={34} height={8} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5}/>
      <rect x={2.5} y={1.5} width={95} height={48} fill="url(#gT)"/>
      {dots.map((d,i)=>(
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={5.2} fill={`${C.red}28`}/>
          <circle cx={d.x} cy={d.y} r={4} fill="url(#dGm)"/>
          <circle cx={d.x} cy={d.y} r={4} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.5}/>
          <text x={d.x} y={d.y} textAnchor="middle" dominantBaseline="central" fontSize={2.4} fill="white" fontWeight="700" fontFamily="system-ui">{d.n}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── Full Pitch ─────────────────────────────────────────── */
function FullPitch({ homePos, awayPos, mode, onClickHome, onClickAway }:{
  homePos: PitchPlayer[]; awayPos: PitchPlayer[];
  mode: "pos"|"player";
  onClickHome: (p: PitchPlayer) => void;
  onClickAway: (p: PitchPlayer) => void;
}) {
  const lc = "rgba(255,255,255,0.85)", lw = 0.55;
  return (
    <svg viewBox="0 0 100 144" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {Array.from({length:9},(_,i)=><rect key={i} x={3} y={3+i*(138/9)} width={94} height={138/9} fill={i%2===0?"#2d8c2d":"#278027"}/>)}
      <rect x={3} y={3} width={94} height={138} fill="none" stroke={lc} strokeWidth={0.7}/>
      {/* Top end */}
      <rect x={22} y={3} width={56} height={20} fill="none" stroke={lc} strokeWidth={lw}/>
      <rect x={37} y={3} width={26} height={7} fill="none" stroke={lc} strokeWidth={lw}/>
      <rect x={44} y={0.5} width={12} height={2.5} fill="rgba(255,255,255,0.12)" stroke={lc} strokeWidth={0.65}/>
      <circle cx={50} cy={18} r={0.75} fill={lc}/>
      <path d="M 43.13 23 A 8.5 8.5 0 0 1 56.87 23" fill="none" stroke={lc} strokeWidth={lw}/>
      {/* Centre */}
      <line x1={3} y1={72} x2={97} y2={72} stroke={lc} strokeWidth={lw}/>
      <circle cx={50} cy={72} r={9} fill="none" stroke={lc} strokeWidth={lw}/>
      <circle cx={50} cy={72} r={0.8} fill={lc}/>
      {/* Bottom end */}
      <rect x={22} y={121} width={56} height={20} fill="none" stroke={lc} strokeWidth={lw}/>
      <rect x={37} y={134} width={26} height={7} fill="none" stroke={lc} strokeWidth={lw}/>
      <rect x={44} y={141} width={12} height={2.5} fill="rgba(255,255,255,0.12)" stroke={lc} strokeWidth={0.65}/>
      <circle cx={50} cy={126} r={0.75} fill={lc}/>
      <path d="M 43.13 121 A 8.5 8.5 0 0 0 56.87 121" fill="none" stroke={lc} strokeWidth={lw}/>
      {/* Corners */}
      <path d="M 3 5 A 2 2 0 0 0 5 3" fill="none" stroke={lc} strokeWidth={lw}/>
      <path d="M 95 3 A 2 2 0 0 0 97 5" fill="none" stroke={lc} strokeWidth={lw}/>
      <path d="M 3 139 A 2 2 0 0 1 5 141" fill="none" stroke={lc} strokeWidth={lw}/>
      <path d="M 95 141 A 2 2 0 0 1 97 139" fill="none" stroke={lc} strokeWidth={lw}/>
      {/* Away team — white dots */}
      {awayPos.map((p,i)=>{
        const r = mode==="pos" ? 4.8 : 4;
        const fs = mode==="pos" ? (p.slotRole.length>2?2.1:2.6) : 3.2;
        return (
          <g key={`a${i}`} onClick={()=>onClickAway(p)} style={{cursor:"pointer"}}>
            <circle cx={p.x} cy={p.y} r={r+2} fill="transparent"/>
            <circle cx={p.x} cy={p.y} r={r} fill="white" opacity={0.95}/>
            <circle cx={p.x} cy={p.y} r={r} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={0.4}/>
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={fs} fill={C.bg} fontWeight="700" fontFamily="system-ui">{mode==="pos"?p.slotRole:p.n}</text>
            {mode==="player" && <text x={p.x} y={p.y-r-1.5} textAnchor="middle" fontSize={2} fill="rgba(255,255,255,0.8)" fontFamily="system-ui">{p.name.substring(0,9)}</text>}
          </g>
        );
      })}
      {/* Home team — red dots */}
      {homePos.map((p,i)=>{
        const r = mode==="pos" ? 4.8 : 4;
        const fs = mode==="pos" ? (p.slotRole.length>2?2.1:2.6) : 3.2;
        return (
          <g key={`h${i}`} onClick={()=>onClickHome(p)} style={{cursor:"pointer"}}>
            <circle cx={p.x} cy={p.y} r={r+2} fill="transparent"/>
            <circle cx={p.x} cy={p.y} r={r} fill={C.red}/>
            <circle cx={p.x} cy={p.y} r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4}/>
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={fs} fill="white" fontWeight="700" fontFamily="system-ui">{mode==="pos"?p.slotRole:p.n}</text>
            {mode==="player" && <text x={p.x} y={p.y+r+2.5} textAnchor="middle" fontSize={2} fill="rgba(255,255,255,0.8)" fontFamily="system-ui">{p.name.substring(0,9)}</text>}
          </g>
        );
      })}
    </svg>
  );
}


/* ─── Tactical Player Modal ──────────────────────────────── */
function TacticalPlayerModal({ player, teamColor, teamFlag, teamName, onClose }:{
  player: PitchPlayer; teamColor: string; teamFlag: string; teamName: string; onClose: ()=>void;
}) {
  const posBadgeColor = player.pos==="GK"?"#888":player.pos==="DF"?C.green:player.pos==="MF"?"#FFB800":C.red;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(7,8,22,0.92)",backdropFilter:"blur(12px)"}} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{background:C.sapphireDk,border:`1px solid ${teamColor}55`,maxWidth:360}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="relative px-6 pt-7 pb-5"
          style={{background:`linear-gradient(150deg, ${C.bg} 0%, ${C.sapphireDk} 45%, ${teamColor}55 130%)`}}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={15} style={{color:"rgba(255,255,255,0.5)"}}/>
          </button>
          <div className="flex items-center gap-4">
            {/* Big number circle */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{background:`linear-gradient(135deg, ${teamColor}, ${teamColor}88)`, border:"2px solid rgba(255,255,255,0.2)"}}>
              <span style={{color:"white",fontSize:"2rem",lineHeight:1,fontWeight:700,...TEKO}}>#{player.n}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest"
                  style={{background:`${posBadgeColor}30`,color:posBadgeColor,border:`1px solid ${posBadgeColor}55`,...MONO}}>{player.slotRole}</span>
                <span className="px-2 py-0.5 rounded text-[9px] tracking-wider"
                  style={{background:"rgba(255,255,255,0.08)",color:C.gray,...MONO}}>{player.pos}</span>
              </div>
              <h2 style={{color:C.white,fontSize:"1.5rem",lineHeight:1,fontWeight:600,letterSpacing:"0.02em",...TEKO}}>{player.full}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base">{teamFlag}</span>
                <span style={{color:C.gray,fontSize:"0.7rem",letterSpacing:"0.15em",...MONO}}>{teamName.toUpperCase()}</span>
                <span style={{color:"#4a5a8a",...MONO,fontSize:"0.7rem"}}>·</span>
                <span style={{color:C.gray,fontSize:"0.7rem",...BARLOW}}>{player.club}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Tactical note */}
        <div className="px-6 py-5">
          <div className="text-[9px] tracking-[0.25em] uppercase mb-2" style={{color:teamColor,...MONO}}>Tactical Role</div>
          <p className="text-sm leading-[1.75]" style={{color:C.gray,...BARLOW}}>{player.note}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Reserves Panel ─────────────────────────────────────── */
function ReservesPanel({ homeSquad, awaySquad, homeCountry, awayCountry }:{
  homeSquad: TeamSquad; awaySquad: TeamSquad;
  homeCountry: typeof COUNTRIES[0]; awayCountry: typeof COUNTRIES[0];
}) {
  const posColor = (pos:string) => pos==="GK"?"#888":pos==="DF"?C.green:pos==="MF"?"#FFB800":C.red;
  return (
    <div className="w-full mt-4 rounded-xl overflow-hidden" style={{maxWidth:360,background:C.sapphireDk,border:`1px solid ${C.border}`}}>
      {[
        {label:"Home Bench",country:homeCountry,bench:homeSquad.bench,dotColor:C.red},
        {label:"Away Bench",country:awayCountry,bench:awaySquad.bench,dotColor:C.white},
      ].map((side,si)=>(
        <div key={si} className={si===0?"border-b":""} style={{borderColor:C.border}}>
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:side.dotColor}}/>
            <span className="text-[9px] tracking-[0.22em] uppercase" style={{color:C.gray,...MONO}}>{side.label}</span>
            <span className="text-base ml-1">{side.country.flag}</span>
            <span className="text-[10px]" style={{color:C.gray,...BARLOW}}>{side.country.name}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{scrollbarWidth:"none"}}>
            {side.bench.map(p=>(
              <div key={p.n} className="flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl"
                style={{background:C.sapphireSm,border:`1px solid ${C.borderSub}`,minWidth:60}}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{background:side.dotColor==="white"?"rgba(255,255,255,0.15)":side.dotColor,...TEKO}}>
                  {p.n}
                </div>
                <span className="text-[9px] text-center leading-tight" style={{color:C.white,...BARLOW,maxWidth:56}}>{p.name}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded" style={{background:`${posColor(p.pos)}20`,color:posColor(p.pos),...MONO}}>{p.pos}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat Bar (roster) ──────────────────────────────────── */
function StatBar({label,value}:{label:string;value:number}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-widest uppercase w-8 flex-shrink-0" style={{color:C.gray,...MONO}}>{label}</span>
      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
        <div className="h-full rounded-full" style={{width:`${value}%`,background:`linear-gradient(90deg,${C.red},#ff5a60)`,transition:"width 0.6s ease"}}/>
      </div>
      <span className="text-xs w-6 text-right flex-shrink-0" style={{color:C.white,...MONO}}>{value}</span>
    </div>
  );
}

/* ─── Roster Player Modal ────────────────────────────────── */
function PlayerModal({player,onClose}:{player:Player;onClose:()=>void}) {
  const stats=[{label:"PAC",value:player.pac},{label:"SHO",value:player.sho},{label:"PAS",value:player.pas},{label:"DRI",value:player.dri},{label:"DEF",value:player.def},{label:"PHY",value:player.phy}];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(7,8,22,0.92)",backdropFilter:"blur(12px)"}} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{background:C.sapphireDk,border:`1px solid ${C.red}44`,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div className="relative px-6 pt-8 pb-6" style={{background:`linear-gradient(150deg,${C.bg} 0%,${C.sapphireDk} 40%,${C.sapphire} 75%,${C.red} 160%)`}}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"><X size={15} style={{color:"rgba(255,255,255,0.5)"}}/></button>
          <div className="flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl" style={{background:`linear-gradient(135deg,${C.red},${C.redDk})`,border:"2px solid rgba(255,255,255,0.2)",fontWeight:700,...TEKO,letterSpacing:"0.02em"}}>{player.abbr}</div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border" style={{background:C.bg,borderColor:`${C.red}66`}}><span className="text-[8px] font-bold" style={{color:C.red,...MONO}}>{player.pos}</span></div>
            </div>
            <div>
              <div style={{color:C.red,fontSize:"3rem",lineHeight:1,fontWeight:700,...TEKO}}>{player.rating}</div>
              <div className="text-[9px] tracking-[0.25em] uppercase mt-1" style={{color:"rgba(255,255,255,0.4)",...MONO}}>Overall Rating</div>
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-[1.4rem] text-white" style={{fontWeight:600,letterSpacing:"0.04em",...TEKO}}>{player.name}</h2>
            <div className="flex items-center gap-2 mt-1"><span className="text-lg">{player.flag}</span><span className="text-[10px] tracking-[0.2em] uppercase" style={{color:"rgba(255,255,255,0.4)",...MONO}}>{player.team.toUpperCase()}</span></div>
          </div>
        </div>
        <div className="px-6 py-5" style={{borderBottom:`1px solid ${C.border}`}}>
          <div className="text-[9px] tracking-[0.25em] uppercase mb-4" style={{color:C.gray,...MONO}}>Attributes</div>
          <div className="space-y-3">{stats.map(s=><StatBar key={s.label} label={s.label} value={s.value}/>)}</div>
        </div>
        <div className="px-6 py-5 space-y-5">
          {[{heading:"Role",body:player.role,bodyColor:C.white},{heading:"Tactical Responsibility",body:player.tactical,bodyColor:C.gray},{heading:"What to Watch",body:player.watch,bodyColor:C.gray}].map(b=>(
            <div key={b.heading}>
              <div className="text-[9px] tracking-[0.25em] uppercase mb-2" style={{color:C.red,...MONO}}>{b.heading}</div>
              <p className="text-sm leading-[1.75]" style={{color:b.bodyColor,...BARLOW}}>{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Screen 1: Login ────────────────────────────────────── */
function LoginScreen({onContinue}:{onContinue:()=>void}) {
  const [step,setStep]=useState<1|2>(1);
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [selTeams,setSelTeams]=useState<string[]>(["usa","bra"]);
  const [selPlayers,setSelPlayers]=useState<number[]>([1,2,7]);
  const favTeams=TEAMS.filter(t=>FAVE_TEAMS.includes(t.id));
  const featPlayers=PLAYERS.slice(0,9);
  const togTeam=(id:string)=>setSelTeams(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const togPlayer=(id:number)=>setSelPlayers(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  return (
    <div className="min-h-screen flex" style={{...BARLOW}}>
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden px-12 py-10" style={{background:`linear-gradient(150deg,${C.sapphire} 0%,${C.bg} 65%)`}}>
        <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        <div className="absolute -right-20 top-10 w-72 h-72 rounded-full" style={{border:`44px solid ${C.red}12`,transform:"rotate(8deg)"}}/>
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{background:`linear-gradient(to bottom,transparent,${C.red},transparent)`}}/>
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:C.red}}><span className="text-white text-sm font-bold" style={{...TEKO}}>FM</span></div>
          <span className="font-semibold tracking-[0.22em] text-sm uppercase" style={{color:"rgba(255,255,255,0.8)",...TEKO}}>Footy Mind</span>
        </div>
        <div className="relative z-10">
          <div className="text-[10px] tracking-[0.38em] uppercase mb-5" style={{color:C.red,...MONO}}>FIFA World Cup 2026</div>
          <h1 className="leading-[0.88] tracking-wide text-white" style={{fontSize:"clamp(3.5rem,5.8vw,5.5rem)",fontWeight:600,...TEKO}}>THE<br/><span style={{color:C.red}}>ULTIMATE</span><br/>FOOTBALL<br/>COMPANION</h1>
          <p className="mt-7 text-[15px] leading-relaxed max-w-xs" style={{color:"rgba(255,255,255,0.45)",...BARLOW}}>AI-powered tactics, live player intelligence, and interactive quiz content — built for the 2026 World Cup.</p>
        </div>
        <div className="relative z-10">
          <div className="h-px w-full mb-5" style={{background:C.border}}/>
          <div className="flex gap-10">{[["32","Nations"],["736","Players"],["64","Matches"]].map(([n,l])=>(
            <div key={l}><div style={{color:C.red,fontSize:"2rem",lineHeight:1,fontWeight:600,...TEKO}}>{n}</div><div className="text-[9px] tracking-[0.28em] uppercase mt-1" style={{color:"rgba(255,255,255,0.35)",...MONO}}>{l}</div></div>
          ))}</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto" style={{background:C.bg}}>
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:C.red}}><span className="text-white text-xs font-bold" style={{...TEKO}}>FM</span></div>
            <span className="text-sm font-semibold tracking-widest uppercase" style={{color:"rgba(255,255,255,0.8)",...TEKO}}>Footy Mind</span>
          </div>
          <div className="flex items-center gap-2 mb-8">{[1,2].map(s=>(
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all" style={{background:step>=s?C.red:C.sapphireSm,color:C.white,...MONO}}>{step>s?<Check size={11}/>:s}</div>
              {s<2&&<div className="w-8 h-px" style={{background:step>1?C.red:C.border}}/>}
            </div>
          ))}</div>
          {step===1?(
            <div>
              <h2 className="text-white mb-1" style={{fontSize:"2.5rem",lineHeight:1,fontWeight:600,...TEKO}}>Welcome back.</h2>
              <p className="text-sm mb-8" style={{color:C.gray,...BARLOW}}>Sign in to your Footy Mind account</p>
              <div className="space-y-4">
                {[{label:"Email",type:"email",value:email,onChange:setEmail,ph:"you@example.com"},{label:"Password",type:"password",value:password,onChange:setPassword,ph:"••••••••"}].map(f=>(
                  <div key={f.label}>
                    <label className="block text-[10px] tracking-[0.28em] uppercase mb-2" style={{color:C.gray,...MONO}}>{f.label}</label>
                    <input type={f.type} value={f.value} onChange={e=>f.onChange(e.target.value)} placeholder={f.ph}
                      className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={{background:C.sapphireSm,border:`1px solid ${C.border}`,color:C.white,...BARLOW}}
                      onFocus={e=>(e.target.style.borderColor=C.red)} onBlur={e=>(e.target.style.borderColor=C.border)}/>
                  </div>
                ))}
                <button onClick={()=>setStep(2)} className="w-full py-3.5 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90 active:scale-[0.98]" style={{background:`linear-gradient(135deg,${C.red},${C.redDk})`,fontSize:"1.05rem",fontWeight:600,...TEKO}}>Continue →</button>
              </div>
              <div className="mt-6 flex items-center gap-3"><div className="flex-1 h-px" style={{background:C.borderSub}}/><span className="text-xs" style={{color:"#555",...MONO}}>or</span><div className="flex-1 h-px" style={{background:C.borderSub}}/></div>
              <p className="mt-4 text-center text-xs" style={{color:"#777",...BARLOW}}>{"Don't have an account? "}<button className="hover:underline" style={{color:C.red}}>Create one</button></p>
            </div>
          ):(
            <div>
              <button onClick={()=>setStep(1)} className="flex items-center gap-1.5 mb-5 text-xs hover:opacity-70" style={{color:C.gray,...MONO}}><ChevronLeft size={13}/> Back</button>
              <h2 className="text-white mb-1" style={{fontSize:"2.2rem",lineHeight:1,fontWeight:600,...TEKO}}>Choose Your Favorites</h2>
              <p className="text-sm mb-6" style={{color:C.gray,...BARLOW}}>Personalise your World Cup experience</p>
              <div className="mb-7">
                <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{color:"#aaa",...MONO}}>Favourite Teams</div>
                <div className="grid grid-cols-3 gap-2">{favTeams.map(t=>{const sel=selTeams.includes(t.id);return(
                  <button key={t.id} onClick={()=>togTeam(t.id)} className="relative flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all" style={{background:sel?`${C.red}18`:C.sapphireSm,border:`1px solid ${sel?C.red:C.borderSub}`}}>
                    {sel&&<div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{background:C.red}}><Check size={9} className="text-white"/></div>}
                    <span className="text-2xl">{t.flag}</span>
                    <span className="text-[11px] font-semibold" style={{color:sel?C.red:C.gray,...TEKO,letterSpacing:"0.06em"}}>{t.name}</span>
                  </button>
                );})}</div>
              </div>
              <div className="mb-8">
                <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{color:"#aaa",...MONO}}>Favourite Players</div>
                <div className="flex flex-wrap gap-2">{featPlayers.map(p=>{const sel=selPlayers.includes(p.id);return(
                  <button key={p.id} onClick={()=>togPlayer(p.id)} className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full text-xs transition-all" style={{background:sel?`${C.red}18`:C.sapphireSm,border:`1px solid ${sel?C.red:C.borderSub}`}}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{background:sel?C.red:C.sapphire,...TEKO}}>{p.abbr[0]}</div>
                    <span style={{color:sel?C.white:C.gray,...BARLOW}}>{p.name.includes(" ")?p.name.split(" ").slice(-1)[0]:p.name}</span>
                    <span className="text-sm">{p.flag}</span>
                  </button>
                );})}</div>
              </div>
              <button onClick={onContinue} className="w-full py-3.5 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90" style={{background:`linear-gradient(135deg,${C.red},${C.redDk})`,fontSize:"1.05rem",fontWeight:600,...TEKO}}>Enter Footy Mind →</button>
              <div className="mt-4 text-center"><button onClick={onContinue} className="text-xs underline underline-offset-2 hover:text-white" style={{color:"#777",...BARLOW}}>Skip for now</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* ─── Screen 2: Dashboard ────────────────────────────────── */
function DashboardScreen({onNavigateRoster,onNavigateTactical,onToggleLegacy,onNavigateFanZone,onNavigateDictionary,onNavigatePhilosophies,onNavigateFormations}:{onNavigateRoster:()=>void;onNavigateTactical:()=>void;onToggleLegacy:()=>void;onNavigateFanZone:()=>void;onNavigateDictionary:()=>void;onNavigatePhilosophies:()=>void;onNavigateFormations:()=>void}) {
  const [selAnswer,setSelAnswer]=useState<number|null>(null);
  const [answered,setAnswered]=useState(false);
  const [currentQ,setCurrentQ]=useState(() => parseInt(localStorage.getItem('quiz_currentQ') || '0'));
  const [quizScore,setQuizScore]=useState(() => parseInt(localStorage.getItem('quiz_quizScore') || '0'));
  const [quizDone,setQuizDone]=useState(false);
  const [proMode,setProMode]=useState(false);
  const [questions,setQuestions]=useState<any[]>([]);
  const [userXP,setUserXP]=useState(0);
  const [uid,setUid]=useState("");
  const [userName,setUserName]=useState("Fan");
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [matchPredictions, setMatchPredictions] = useState<Record<number, {home:number, away:number, predicted:boolean, resultProcessed?:boolean, correct?:boolean}>>({});
  useEffect(() => {
    // Subscribe to Auth State
    const unsub = subscribeToAuth(async (user) => {
      if (user) {
        setUid(user.uid);
        const userData = await getUserData(user.uid);
        setUserXP(userData.xp);
        setUserName(userData.name || user.displayName || "Fan");
        
        // Check quiz completion from Firebase
        const today = new Date().toISOString().split('T')[0];
        if (userData.lastQuizDone === today) setQuizDone(true);
        
        if (userData.predictions) {
          setMatchPredictions(userData.predictions);
        }
      } else {
        setUid("");
        setUserName("Fan");
        setUserXP(0);
      }
    });

    getDailyQuiz().then(q => setQuestions(q));
    getLiveFixtures().then(f => setLiveFixtures(f));
    const interval = setInterval(() => {
      getLiveFixtures().then(f => setLiveFixtures(f));
    }, 60000);
    
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    liveFixtures.forEach(async f => {
      const pred = matchPredictions[f.fixture.id];
      if (pred && pred.predicted && !pred.resultProcessed && (f.fixture.status.short === "FT" || f.fixture.status.short === "PEN")) {
        const isCorrect = (pred.home === f.goals.home && pred.away === f.goals.away);
        if (isCorrect) {
          const newXp = await addUserXP(uid, 50);
          setUserXP(newXp);
        }
        await updatePredictionResult(uid, f.fixture.id, isCorrect);
        setMatchPredictions(prev => ({
          ...prev,
          [f.fixture.id]: { ...pred, resultProcessed: true, correct: isCorrect }
        }));
      }
    });
  }, [liveFixtures, matchPredictions, uid]);

  useEffect(() => {
    localStorage.setItem('quiz_currentQ', currentQ.toString());
    localStorage.setItem('quiz_quizScore', quizScore.toString());
  }, [currentQ, quizScore]);

  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const Q=questions[currentQ];

  const handleNext=async ()=>{
    if(!answered){
      setAnswered(true);
      if(selAnswer===Q?.correct) setQuizScore(s=>s+1);
    } else {
      if(currentQ<questions.length-1){
        setCurrentQ(q=>q+1);setSelAnswer(null);setAnswered(false);
      } else {
        setQuizDone(true);
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('lastQuizDone', todayStr); // local fallback
        if (uid) {
          saveQuizCompletion(uid, todayStr);
          const earned = quizScore * 50 + (selAnswer===Q?.correct ? 50 : 0);
          const newXP = await addUserXP(uid, earned);
          setUserXP(newXP);
        }
      }
    }
  };
  const resetQuiz=()=>{setCurrentQ(0);setSelAnswer(null);setAnswered(false);setQuizScore(0);setQuizDone(false);};
  return (
    <div className="min-h-screen" style={{background:C.bg,...BARLOW}}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5" style={{background:`rgba(13,16,51,0.96)`,backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.borderSub}`}}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:C.red}}><span className="text-white text-xs font-bold" style={{...TEKO,letterSpacing:"0.04em"}}>FM</span></div>
          <span className="font-semibold tracking-[0.2em] text-sm uppercase" style={{color:"rgba(255,255,255,0.85)",...TEKO}}>Footy Mind</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Tournament Mode Switcher — 2022 Legacy */}
          <button
            onClick={onToggleLegacy}
            className="hidden sm:flex items-center gap-1.5 transition-all hover:opacity-80"
            style={{padding:"5px 11px",borderRadius:20,background:"rgba(86,4,44,0.18)",border:"1px solid rgba(254,195,16,0.35)",cursor:"pointer"}}
          >
            <span style={{fontSize:"0.85rem"}}>🇶🇦</span>
            <span style={{color:"#FEC310",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",...TEKO}}>QATAR 2022</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] tracking-wider" style={{color:"#8899bb",...MONO}}>
            <div className="w-1.5 h-1.5 rounded-full" style={{background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>LIVE
          </div>
          <div className="flex flex-col items-end justify-center mr-2">
            <span className="text-[10px]" style={{color:C.gray,...MONO}}>{userXP} XP</span>
            <div className="w-16 h-1.5 rounded-full mt-0.5" style={{background:C.sapphireSm, overflow:"hidden"}}>
              <div className="h-full rounded-full transition-all" style={{background:C.red, width:`${Math.min(100, (userXP%1000)/10)}%`}} />
            </div>
          </div>
          <button onClick={() => { logoutUser(); setScreen("login"); }} className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors hover:bg-red-500" style={{background:C.redDk, color:C.white, border:`1px solid ${C.red}`}}>Log Out</button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:`linear-gradient(135deg,${C.sapphire},${C.red})`,...TEKO}}>YO</div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <div className="text-[9px] tracking-[0.38em] uppercase mb-1" style={{color:C.red,...MONO}}>{dateStr}</div>
            <h1 className="text-white" style={{fontSize:"2.2rem",lineHeight:1.1,fontWeight:600,...TEKO}}>Good Evening, Fan.</h1>
          </div>
          <div className="text-right">
            <div className="text-[10px]" style={{color:C.gray,...MONO}}>TOTAL XP</div>
            <div className="text-2xl font-bold" style={{color:C.gold || C.red,...TEKO}}>{userXP}</div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden mb-5" style={{background:C.sapphire,border:`1px solid ${C.red}38`}}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{borderBottom:`1px solid ${C.border}`}}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:`${C.red}28`}}><Zap size={13} style={{color:C.red}}/></div>
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{color:C.red,...MONO}}>AI Daily Quiz</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px]" style={{color:C.gray,...MONO}}>{quizDone?"Done":currentQ+1} / 5</span>
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.12)"}}><div className="h-full rounded-full transition-all duration-300" style={{width:`${((quizDone?5:currentQ+1)/5)*100}%`,background:C.red}}/></div>
            </div>
          </div>
          <div className="px-5 py-5">
            {questions.length === 0 ? (
              <div className="text-center py-10" style={{color:C.gray,...MONO}}>Loading Daily AI Quiz...</div>
            ) : quizDone ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">{quizScore>=4?"🏆":quizScore>=3?"⚽":"🎓"}</div>
                <div className="text-2xl text-white font-bold mb-1" style={{...TEKO}}>{quizScore}/5 Correct</div>
                <p className="text-sm mb-4" style={{color:C.gray,...BARLOW}}>You earned {quizScore*50} XP today.</p>
              </div>
            ):(
              <>
                <p className="text-[15px] font-medium text-white leading-relaxed mb-5" style={{...BARLOW}}>{Q?.question}</p>
                <div className="space-y-2.5 mb-6">{Q?.options.map((opt:string,i:number)=>{
                  const isSel=selAnswer===i;
                  let bg = "rgba(255,255,255,0.06)";
                  let border = "rgba(255,255,255,0.1)";
                  let color = C.gray;
                  
                  if (!answered) {
                    if (isSel) { bg = `${C.red}22`; border = C.red; color = C.white; }
                  } else {
                    if (i === Q.correct) { bg = "rgba(34,197,94,0.2)"; border = "#22c55e"; color = "#22c55e"; }
                    else if (isSel && i !== Q.correct) { bg = "rgba(239,68,68,0.2)"; border = "#ef4444"; color = "#ef4444"; }
                  }

                  return(
                    <button key={i} onClick={()=>!answered && setSelAnswer(i)} disabled={answered} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all" style={{background:bg,border:`1px solid ${border}`,cursor:answered?"default":"pointer"}}>
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border transition-all" style={{borderColor:border,background:isSel&&!answered?C.red:"transparent"}}>
                        {answered && i === Q.correct ? <Check size={12} color="#22c55e"/> : answered && isSel && i !== Q.correct ? <X size={12} color="#ef4444"/> : isSel && !answered && <div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <span className="text-[13px]" style={{color,...BARLOW}}>{opt}</span>
                    </button>
                  );
                })}</div>
                <div className="flex justify-end mt-2">
                  <button onClick={handleNext} disabled={selAnswer===null}
                    className="px-6 py-3 rounded-xl text-white font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{background:`linear-gradient(135deg,${C.red},${C.redDk})`,fontSize:"0.95rem",...TEKO}}>
                    {!answered ? "Submit Answer" : currentQ<questions.length-1?"Next Question →":"See Results →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Live Matches & Predictor */}
        {liveFixtures.length > 0 && (
          <div className="mb-6">
            <div className="text-[9px] tracking-[0.32em] uppercase mb-3 flex items-center justify-between" style={{color:"#8899bb",...MONO}}>
              <span>Live & Upcoming</span>
              <span className="text-red-400">Predict Scores for XP!</span>
            </div>
            <div className="space-y-3">
              {liveFixtures.map(f => {
                const pred = matchPredictions[f.fixture.id] || { home: 0, away: 0, predicted: false };
                
                return (
                  <div key={f.fixture.id} className="rounded-xl px-4 py-3 flex flex-col gap-3" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px]" style={{color:C.gray,...MONO}}>{f.league.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5 w-20">
                            <img src={f.teams.home.logo} alt="home" className="w-5 h-5 object-contain" />
                            <span className="text-sm text-white font-bold" style={{...TEKO}}>{f.teams.home.name}</span>
                          </div>
                          
                          {/* Live Score */}
                          <span className="text-base text-white font-bold w-12 text-center bg-black/30 rounded" style={{...TEKO}}>
                            {f.goals.home} - {f.goals.away}
                          </span>
                          
                          <div className="flex items-center gap-1.5 w-20 flex-row-reverse">
                            <img src={f.teams.away.logo} alt="away" className="w-5 h-5 object-contain" />
                            <span className="text-sm text-white font-bold" style={{...TEKO}}>{f.teams.away.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-[9px]" style={{color:C.red,...MONO}}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{background:C.red,boxShadow:`0 0 6px ${C.red}`}}/>{f.fixture.status.elapsed}&apos;
                        </div>
                      </div>
                    </div>
                    
                    {/* Predictor UI */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-[10px]" style={{color:C.gray,...MONO}}>YOUR PREDICTION:</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" value={pred.home} disabled={pred.predicted} 
                          onChange={e => setMatchPredictions(prev => ({...prev, [f.fixture.id]: {...pred, home: parseInt(e.target.value)||0}}))}
                          className="w-10 text-center bg-black/40 text-white border border-white/10 rounded" style={{...TEKO, fontSize: "1.2rem"}} />
                        <span className="text-gray-500">-</span>
                        <input type="number" min="0" value={pred.away} disabled={pred.predicted} 
                          onChange={e => setMatchPredictions(prev => ({...prev, [f.fixture.id]: {...pred, away: parseInt(e.target.value)||0}}))}
                          className="w-10 text-center bg-black/40 text-white border border-white/10 rounded" style={{...TEKO, fontSize: "1.2rem"}} />
                        
                        {f.fixture.status.elapsed > 10 && !pred.predicted ? (
                          <div className="ml-3 px-3 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded text-xs font-bold" style={{...BARLOW}}>
                            WINDOW CLOSED
                          </div>
                        ) : !pred.predicted ? (
                          <button onClick={async () => {
                              const newPred = {...pred, predicted: true};
                              setMatchPredictions(prev => ({...prev, [f.fixture.id]: newPred}));
                              if (uid) await saveMatchPrediction(uid, f.fixture.id, {home: pred.home, away: pred.away});
                            }}
                            className="ml-3 px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30 rounded text-xs font-bold transition-all" style={{...BARLOW}}>
                            LOCK IN
                          </button>
                        ) : pred.resultProcessed ? (
                          <div className={`ml-3 px-3 py-1 border rounded text-xs font-bold ${pred.correct ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}`} style={{...BARLOW}}>
                            {pred.correct ? 'CORRECT (+50 XP)' : 'WRONG (0 XP)'}
                          </div>
                        ) : (
                          <div className="ml-3 px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-xs font-bold" style={{...BARLOW}}>
                            LOCKED (±50 XP)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{color:"#8899bb",...MONO}}>Explore</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div onClick={onNavigateTactical} className="rounded-2xl overflow-hidden group cursor-pointer transition-all" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
            <div className="relative overflow-hidden" style={{height:180,background:"#0A2E16"}}>
              <TacticalPitchMini/>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white" style={{background:C.red,fontSize:9,letterSpacing:"0.06em",...MONO}}><Star size={8}/> Beginner &amp; Pro Toggles Included</div>
              <div className="absolute bottom-3 right-3 flex items-center rounded-full overflow-hidden" style={{border:`1px solid ${C.border}`,background:"rgba(0,0,0,0.6)"}}>
                {["POS","PLY"].map((lbl,i)=>(
                  <button key={lbl} onClick={e=>{e.stopPropagation();setProMode(i===1);}} className="px-3 py-1 text-[9px] font-bold transition-all" style={{background:proMode===(i===1)?C.red:"transparent",color:C.white,...MONO}}>{lbl}</button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-white" style={{fontSize:"1rem",fontWeight:600,letterSpacing:"0.03em",...TEKO}}>22-Player Tactical Pitch</h3>
                <p className="text-[11px] mt-0.5" style={{color:C.gray,...BARLOW}}>Real squads · formation explorer</p>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all" style={{background:"rgba(255,255,255,0.08)"}}><ArrowRight size={13} style={{color:C.white}}/></div>
            </div>
          </div>
          <div onClick={onNavigateRoster} className="rounded-2xl overflow-hidden group cursor-pointer transition-all" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
            <div className="relative flex items-center justify-center overflow-hidden" style={{height:180,background:`linear-gradient(145deg,${C.sapphireSm},${C.sapphire})`}}>
              <div className="relative" style={{width:130,height:110}}>
                {PLAYERS.slice(0,3).map((p,i)=>(
                  <div key={p.id} className="absolute rounded-xl flex flex-col items-center justify-center gap-1" style={{width:68,height:92,background:i===0?`linear-gradient(155deg,${C.sapphireSm},${C.bg})`:i===1?`linear-gradient(155deg,${C.sapphire},${C.sapphireDk})`:`linear-gradient(155deg,${C.bg},${C.sapphireSm})`,border:`1px solid ${C.border}`,left:i*28,top:(2-i)*5,transform:`rotate(${[-9,-2,7][i]}deg)`,zIndex:i+1}}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:C.red,...TEKO}}>{p.abbr}</div>
                    <div className="text-[8px] font-bold" style={{color:C.gray,...TEKO}}>{p.name.split(" ").slice(-1)[0]}</div>
                    <div className="text-[7px]" style={{color:C.red,...MONO}}>{p.pos}</div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-3 left-4 text-[10px]" style={{color:C.gray,...MONO}}>{PLAYERS.length} players indexed</div>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-white" style={{fontSize:"1rem",fontWeight:600,letterSpacing:"0.03em",...TEKO}}>World Cup Player Cards Hub</h3>
                <p className="text-[11px] mt-0.5" style={{color:C.gray,...BARLOW}}>Browse all 32 nations</p>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all" style={{background:"rgba(255,255,255,0.08)"}}><ArrowRight size={13} style={{color:C.white}}/></div>
            </div>
          </div>
          
          {/* Key Terms Mini */}
          <div onClick={onNavigateDictionary} className="rounded-2xl overflow-hidden group cursor-pointer transition-all sm:col-span-2" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full" style={{background:`linear-gradient(135deg, ${C.red}, ${C.redDk})`}}>
                  <BookOpen size={24} color={C.white} />
                </div>
                <div>
                  <h3 className="text-white font-bold" style={{...TEKO}}>Tactical Dictionary</h3>
                  <p className="text-[11px]" style={{color:C.gray,...BARLOW}}>Master every football term</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all" style={{background:"rgba(255,255,255,0.08)"}}><ArrowRight size={13} style={{color:C.white}}/></div>
            </div>
          </div>

          {/* Formations Mini */}
          <div onClick={onNavigateFormations} className="rounded-2xl overflow-hidden group cursor-pointer transition-all sm:col-span-2" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
             <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full" style={{background:`linear-gradient(135deg, ${C.red}, ${C.redDk})`}}>
                  <BookOpen size={24} color={C.white} />
                </div>
                <div>
                  <h3 className="text-white font-bold" style={{...TEKO}}>Formations & Tactics</h3>
                  <p className="text-[11px]" style={{color:C.gray,...BARLOW}}>Explore team shapes & strategies</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all" style={{background:"rgba(255,255,255,0.08)"}}><ArrowRight size={13} style={{color:C.white}}/></div>
            </div>
          </div>
        </div>
              
      </main>
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 py-3" style={{background:`rgba(13,16,51,0.97)`,backdropFilter:"blur(12px)",borderTop:`1px solid ${C.borderSub}`}}>
        {[{Icon:Home,label:"Home",active:true,fn:undefined},{Icon:Trophy,label:"Quiz",active:false,fn:()=>{window.scrollTo(0,0)}},{Icon:Users,label:"Roster",active:false,fn:onNavigateRoster},{Icon:Gamepad2,label:"Fan Zone",active:false,fn:onNavigateFanZone},{Icon:Globe,label:"Live",active:false,fn:undefined}].map(({Icon,label,active,fn})=>(
          <button key={label} onClick={fn} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity" style={{color:active?C.red:"#4a5a8a"}}><Icon size={19}/><span className="text-[9px] tracking-wider" style={{...MONO}}>{label}</span></button>
        ))}
      </div>
    </div>
  );
}


/* ─── Tactical Screen ────────────────────────────────────── */
function TacticalScreen({onBack}:{onBack:()=>void}) {
  const [activeSidebar,setActiveSidebar]=useState<string|null>(null);
  const [mode,setMode]=useState<"pos"|"player">("pos");
  const [showReserves, setShowReserves]=useState(false);
  const [homeCountry,setHomeCountry]=useState<typeof COUNTRIES[0]>(COUNTRIES[0]);
  const [awayCountry,setAwayCountry]=useState<typeof COUNTRIES[0]>(COUNTRIES[1]);
  const [clickedPlayer,setClickedPlayer]=useState<PitchPlayer|null>(null);
/* ─── App Router ─────────────────────────────────────────── */

  const homeSquad = SQUAD_DATA[homeCountry.id];
  const awaySquad = SQUAD_DATA[awayCountry.id];

  // Default formation from home team's squad; user can override
  const [homeFormation,setHomeFormation]=useState(homeSquad.defaultFormation);
  const [awayFormation,setAwayFormation]=useState(awaySquad.defaultFormation);
  const formKeys = Object.keys(FORMATION_DATA);

  // Merge squad starters with formation x/y positions
  const homeFormPositions = FORMATION_DATA[homeFormation]?.positions ?? FORMATION_DATA["4-3-3"].positions;
  const awayFormPositions = FORMATION_DATA[awayFormation]?.positions ?? FORMATION_DATA["4-3-3"].positions;
  const homePos: PitchPlayer[] = homeFormPositions.map((fp,i) => ({
    ...homeSquad.starters[i], x: fp.x, y: fp.y, slotRole: fp.role,
  }));
  const awayPos: PitchPlayer[] = awayFormPositions.map((fp,i) => ({
    ...awaySquad.starters[i], x: 100-fp.x, y: 144-fp.y, slotRole: fp.role,
  }));

  const toggleSidebar=(key:string)=>setActiveSidebar(p=>p===key?null:key);
  const handleHomeCountry=(c:typeof COUNTRIES[0])=>{setHomeCountry(c);setHomeFormation(SQUAD_DATA[c.id].defaultFormation);setActiveSidebar(null);};
  const handleAwayCountry=(c:typeof COUNTRIES[0])=>{setAwayCountry(c);setAwayFormation(SQUAD_DATA[c.id].defaultFormation);setActiveSidebar(null);};

  const sidebarItems=[
    {n:1,label:"Formation",   key:"formation"},
    {n:2,label:"Home Country",key:"home"},
    {n:3,label:"Away Country",key:"away"},
    {n:4,label:"Mode",        key:"mode"},
    {n:5,label:"Reserves",    key:"reserves"},
    {n:6,label:"Simulation",  key:"sim",locked:true},
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{background:C.bg}}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{background:`rgba(13,16,51,0.97)`,backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.borderSub}`}}>
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors" style={{border:`1px solid ${C.border}`}}><ChevronLeft size={15} style={{color:C.gray}}/></button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:C.red}}><span className="text-white text-xs font-bold" style={{...TEKO}}>FM</span></div>
            <span className="font-semibold tracking-[0.2em] text-sm uppercase" style={{color:"rgba(255,255,255,0.85)",...TEKO}}>Footy Mind</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-1">
            <div className="h-4 w-px" style={{background:C.border}}/>
            <span className="text-[10px] tracking-[0.25em] uppercase" style={{color:C.red,...MONO}}>Tactical Pitch</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Matchup pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{background:C.sapphire,border:`1px solid ${C.border}`}}>
            <span className="text-base">{homeCountry.flag}</span>
            <span style={{color:C.red,fontWeight:600,fontSize:"0.95rem",...TEKO,letterSpacing:"0.04em"}}>{homeFormation} vs {awayFormation}</span>
            <span className="text-base">{awayCountry.flag}</span>
          </div>
          {/* POS / PLY toggle */}
          <div className="flex items-center rounded-full overflow-hidden" style={{border:`1px solid ${C.border}`,background:C.sapphireSm}}>
            {(["pos","player"] as const).map((m,i)=>(
              <button key={m} onClick={()=>setMode(m)} className="px-3 py-1.5 text-[10px] font-bold transition-all" style={{background:mode===m?C.red:"transparent",color:C.white,...MONO}}>{["POS","PLY"][i]}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile controls */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 overflow-x-auto flex-shrink-0" style={{borderBottom:`1px solid ${C.borderSub}`,scrollbarWidth:"none"}}>
        <span className="text-[9px] tracking-widest whitespace-nowrap" style={{color:C.gray,...MONO}}>FORM:</span>
        {formKeys.map(f=>(
            <button key={f} onClick={()=>setHomeFormation(f)} className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all" style={{background:homeFormation===f?C.red:C.sapphireSm,border:`1px solid ${homeFormation===f?C.red:C.borderSub}`,color:C.white,...TEKO,letterSpacing:"0.04em"}}>{f}</button>
        ))}
        <div className="h-4 w-px mx-1 flex-shrink-0" style={{background:C.border}}/>
        {COUNTRIES.map(c=>(
          <button key={c.id} onClick={()=>handleHomeCountry(c)} className="flex-shrink-0 px-2 py-1 rounded-full text-xs transition-all" title={c.name}
            style={{background:homeCountry.id===c.id?`${C.red}30`:C.sapphireSm,border:`1px solid ${homeCountry.id===c.id?C.red:C.borderSub}`}}>{c.flag}</button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col gap-1.5 p-3 flex-shrink-0 overflow-y-auto" style={{width:210,borderRight:`1px solid ${C.borderSub}`}}>
          {sidebarItems.map(item=>{
            const isActive=activeSidebar===item.key;
            return (
              <div key={item.key}>
                <button
                  onClick={()=>{
                    if((item as any).locked) return;
                    if(item.key==="mode"){setMode(m=>m==="pos"?"player":"pos");return;}
                    if(item.key==="reserves"){setShowReserves(s=>!s);return;}
                    toggleSidebar(item.key);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{background:isActive||((item.key==="reserves"&&showReserves)||(item.key==="mode"))?`${C.red}1a`:C.sapphireSm,
                    border:`1px solid ${isActive||(item.key==="reserves"&&showReserves)?C.red:C.borderSub}`,
                    opacity:(item as any).locked?0.45:1,cursor:(item as any).locked?"not-allowed":"pointer"}}>
                  <span className="text-[10px] font-bold w-4 text-center flex-shrink-0" style={{color:isActive?C.red:C.gray,...MONO}}>{item.n}</span>
                  <span className="text-[11px] font-semibold tracking-wide flex-1" style={{color:isActive?C.white:C.gray,...TEKO,letterSpacing:"0.08em"}}>{item.label.toUpperCase()}</span>
                  {(item as any).locked && <Lock size={11} style={{color:C.gray}}/>}
                  {item.key==="mode" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px]" style={{color:C.gray,...MONO}}>PLY</span>
                      <div className="w-7 h-3.5 rounded-full relative transition-colors" style={{background:mode==="pos"?C.red:C.sapphireDk, border:`1px solid ${C.borderSub}`}}>
                        <div className="absolute top-[1px] w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm" style={{left:mode==="pos"?'13px':'2px'}} />
                      </div>
                      <span className="text-[9px]" style={{color:C.red,...MONO}}>POS</span>
                    </div>
                  )}
                  {item.key==="reserves" && (
                    <div className="w-7 h-3.5 rounded-full relative transition-colors" style={{background:showReserves?C.red:C.sapphireDk, border:`1px solid ${C.borderSub}`}}>
                      <div className="absolute top-[1px] w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm" style={{left:showReserves?'13px':'2px'}} />
                    </div>
                  )}
                </button>
                {isActive && item.key === "homeFormation" && (
                  <div className="mt-2 flex flex-col gap-1 pl-6">
                    {formKeys.map(f => (
                      <button key={f} onClick={() => setHomeFormation(f)} className="text-left text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all" style={{color: homeFormation===f?C.white:C.gray, background: homeFormation===f?C.red:'transparent', ...TEKO, letterSpacing:"0.04em"}}>{f}</button>
                    ))}
                  </div>
                )}
                {isActive && item.key === "awayFormation" && (
                  <div className="mt-2 flex flex-col gap-1 pl-6">
                    {formKeys.map(f => (
                      <button key={f} onClick={() => setAwayFormation(f)} className="text-left text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all" style={{color: awayFormation===f?C.white:C.gray, background: awayFormation===f?C.red:'transparent', ...TEKO, letterSpacing:"0.04em"}}>{f}</button>
                    ))}
                  </div>
                )}
                {isActive && item.key === "home" && (
                  <div className="mt-2 flex flex-col gap-1 pl-6">
                    {COUNTRIES.map(c => (
                      <button key={c.id} onClick={() => handleHomeCountry(c)} className="flex items-center gap-2 text-left text-[13px] px-3 py-1.5 rounded-lg transition-all" style={{background: homeCountry.id===c.id?`${C.red}30`:'transparent', border: `1px solid ${homeCountry.id===c.id?C.red:'transparent'}`}}><span>{c.flag}</span> <span style={{color: C.white, ...TEKO, letterSpacing:"0.04em"}}>{c.name}</span></button>
                    ))}
                  </div>
                )}
                {isActive && item.key === "away" && (
                  <div className="mt-2 flex flex-col gap-1 pl-6">
                    {COUNTRIES.map(c => (
                      <button key={c.id} onClick={() => handleAwayCountry(c)} className="flex items-center gap-2 text-left text-[13px] px-3 py-1.5 rounded-lg transition-all" style={{background: awayCountry.id===c.id?`${C.red}30`:'transparent', border: `1px solid ${awayCountry.id===c.id?C.red:'transparent'}`}}><span>{c.flag}</span> <span style={{color: C.white, ...TEKO, letterSpacing:"0.04em"}}>{c.name}</span></button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>
        
        {/* Main Pitch Area */}
        <div className="flex-1 relative bg-black/20 overflow-hidden flex flex-col">
          <div className="flex-1 relative">
            <Pitch3D 
              players={[
                ...homePos.map((p, i) => ({ id: 'home_'+i, position: [p.x, p.y], team: 'home' as const, number: p.n?.toString() || '0', name: p.name })),
                ...awayPos.map((p, i) => ({ id: 'away_'+i, position: [p.x, p.y], team: 'away' as const, number: p.n?.toString() || '0', name: p.name }))
              ]}
              homeColor={homeCountry.color || '#facc15'}
              awayColor={awayCountry.color || '#3b82f6'}
              selectedPlayerId={clickedPlayer?.player.name} // using name for selection
              onPlayerClick={(id) => {
                if (id.startsWith('home_')) {
                  const idx = parseInt(id.split('_')[1]);
                  setClickedPlayer({player: homePos[idx], team: 'home'});
                } else if (id.startsWith('away_')) {
                  const idx = parseInt(id.split('_')[1]);
                  setClickedPlayer({player: awayPos[idx], team: 'away'});
                }
              }}
            />
          </div>
          {/* Reserves Panel */}
          {showReserves && (
            <div className="w-full flex-shrink-0 overflow-x-auto bg-black/60 backdrop-blur-md border-t border-white/10 p-4" style={{scrollbarWidth:'none'}}>
              <div className="flex gap-4 min-w-max pb-2">
                <div className="flex gap-2 border-r border-white/10 pr-4">
                  {homeSquad.bench.map(bp => (
                    <button key={bp.n} onClick={() => setClickedPlayer({player: bp, team: 'home'})} className="flex flex-col items-center bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all border border-white/5 min-w-[80px]">
                      <span className="text-xs font-bold text-yellow-400 mb-1">{bp.n}</span>
                      <span className="text-[10px] text-white/70 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{bp.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {awaySquad.bench.map(bp => (
                    <button key={bp.n} onClick={() => setClickedPlayer({player: bp, team: 'away'})} className="flex flex-col items-center bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all border border-white/5 min-w-[80px]">
                      <span className="text-xs font-bold text-blue-400 mb-1">{bp.n}</span>
                      <span className="text-[10px] text-white/70 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{bp.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {clickedPlayer && (() => {
        const cp = clickedPlayer.player as any; // PitchPlayer or BenchMember
        const cTeam = clickedPlayer.team === 'home' ? homeCountry : awayCountry;
        const found = PLAYERS.find(p => p.name === cp.name || p.name === cp.full);
        const playerProp: Player = found || {
          id: cp.n,
          name: cp.name,
          abbr: cp.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase(),
          pos: cp.pos,
          team: cTeam.id,
          flag: cTeam.flag,
          rating: 80,
          pac: 75, sho: 75, pas: 75, dri: 75, def: 75, phy: 75,
          role: cp.slotRole || cp.pos,
          tactical: cp.note || "A reliable presence on the pitch.",
          watch: "Overall contribution to the team's shape."
        };
        if (mode === "pos") {
          return <TacticalPlayerModal player={cp} teamColor={cTeam.color || "#000"} teamFlag={cTeam.flag} teamName={cTeam.name} onClose={()=>setClickedPlayer(null)} />;
        }
        return <PlayerModal player={playerProp} onClose={()=>setClickedPlayer(null)} />;
      })()}
    </div>
  );
}


function RosterScreen({onBack}:{onBack:()=>void}) {
  const [activeTeam,setActiveTeam]=useState("all");
  const [selPlayer,setSelPlayer]=useState<Player|null>(null);
  const filtered=activeTeam==="all"?PLAYERS:PLAYERS.filter(p=>{
    const t=TEAMS.find(x=>x.id===activeTeam);
    return p.team===activeTeam || (t && p.team===t.name);
  });
  const posColor=(pos:string)=>pos==="FWD"?C.red:pos==="MID"?C.gray:C.green;
  return (
    <div className="min-h-screen" style={{background:C.bg,...BARLOW}}>
      <header className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{background:`rgba(13,16,51,0.97)`,backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.borderSub}`}}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center" style={{border:`1px solid ${C.border}`}}><ChevronLeft size={15} style={{color:C.gray}}/></button>
          <div><h1 className="text-white" style={{fontSize:"1.4rem",lineHeight:1,fontWeight:600,...TEKO}}>Player Cards Hub</h1><p className="text-[10px] mt-0.5" style={{color:C.gray,...MONO}}>{PLAYERS.length} players · FIFA World Cup 2026</p></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
          {TEAMS.map(t=>{const active=activeTeam===t.id;return(
            <button key={t.id} onClick={()=>setActiveTeam(t.id)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{background:active?C.red:C.sapphireSm,border:`1px solid ${active?C.red:C.borderSub}`,color:active?C.white:C.gray,...BARLOW}}>
              <span className="text-sm leading-none">{t.flag}</span><span>{t.name}</span>
            </button>
          );})}
        </div>
      </header>
      <main className="px-4 py-5 pb-10">
        {filtered.length===0?<div className="py-24 text-center" style={{color:C.gray,...BARLOW}}>No players indexed for this nation yet.</div>:(
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(player=>(
              <button key={player.id} onClick={()=>setSelPlayer(player)} className="relative group rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.026]" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`,aspectRatio:"2/3"}}>
                <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center" style={{height:"62%",background:`linear-gradient(160deg,${C.sapphire} 0%,${C.sapphireDk} 100%)`}}>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-16 h-16 rounded-full opacity-25" style={{background:posColor(player.pos),filter:"blur(18px)"}}/></div>
                  <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-white" style={{background:`${posColor(player.pos)}22`,border:`1.5px solid ${posColor(player.pos)}55`,fontSize:"1rem",fontWeight:600,...TEKO,letterSpacing:"0.04em"}}>{player.abbr}</div>
                  <div className="absolute top-2 left-2.5"><div style={{color:C.red,fontSize:"1.15rem",lineHeight:1,fontWeight:600,...TEKO}}>{player.rating}</div><div className="text-[7px] mt-0.5" style={{color:C.gray,...MONO}}>{player.pos}</div></div>
                  <div className="absolute top-2 right-2.5 text-base">{player.flag}</div>
                  <div className="absolute bottom-0 inset-x-0 h-[2px]" style={{background:posColor(player.pos)}}/>
                </div>
                <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 flex flex-col justify-between" style={{height:"38%",background:C.sapphireDk}}>
                  <div><div className="text-[9px] tracking-wider uppercase" style={{color:posColor(player.pos),...MONO}}>{player.pos}</div><div className="text-white leading-tight truncate" style={{fontSize:"0.9rem",fontWeight:600,...TEKO}}>{player.name}</div></div>
                  <div className="text-[9px] uppercase tracking-wider" style={{color:"#8899bb",...MONO}}>{player.team.toUpperCase()}</div>
                </div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{border:`1px solid ${C.red}88`,boxShadow:`0 0 20px ${C.red}18`}}/>
              </button>
            ))}
          </div>
        )}
      </main>
      {selPlayer&&<PlayerModal player={selPlayer} onClose={()=>setSelPlayer(null)}/>}
    </div>
  );
}

/* ─── Screen 4: Tactical Pitch ───────────────────────────── */



/* ─── Screen: Philosophies ──────────────────────────────── */
function PhilosophiesScreen({onBack}:{onBack:()=>void}) {
  const [activeTab, setActiveTab] = useState<"philosophies"|"formations">("philosophies");
  const [expandedId, setExpandedId] = useState<string|null>(null);

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{background:C.bg}}>
      <header className="flex flex-col pt-12 pb-4 px-6 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 z-0 opacity-30" style={{background:`radial-gradient(circle at right top, ${C.sapphire}, transparent 70%)`}}/>
        <div className="relative z-10 flex items-center justify-between">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`}}><ChevronLeft size={18} style={{color:C.gray}}/></button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{background:C.red}}><span className="text-white text-xs font-bold" style={{...TEKO}}>FM</span></div>
          </div>
        </div>
        <div className="relative z-10 mt-6">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{color:C.red,...MONO}}>Knowledge Base</div>
          <h1 className="text-white leading-none" style={{fontSize:"2.5rem",fontWeight:700,...TEKO}}>Tactics & Formations</h1>
        </div>
        
        {/* Tabs */}
        <div className="relative z-10 flex gap-4 mt-6 border-b border-white/10 pb-2">
          <button onClick={() => setActiveTab("philosophies")} className="uppercase tracking-widest text-xs font-bold pb-2 transition-colors relative" style={{color:activeTab==="philosophies"?C.white:C.gray,...MONO}}>
            Philosophies
            {activeTab==="philosophies" && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-red-600 rounded-t"/>}
          </button>
          <button onClick={() => setActiveTab("formations")} className="uppercase tracking-widest text-xs font-bold pb-2 transition-colors relative" style={{color:activeTab==="formations"?C.white:C.gray,...MONO}}>
            Formations
            {activeTab==="formations" && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-red-600 rounded-t"/>}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {activeTab === "philosophies" && PHILOSOPHIES.map((phil:any) => (
          <div key={phil.id} className="rounded-xl p-5" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
            <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => setExpandedId(p => p === phil.id ? null : phil.id)}>
              <div className="w-3 h-3 rounded-full" style={{background:phil.color,boxShadow:`0 0 8px ${phil.color}88`}}/>
              <h3 className="text-lg text-white font-bold tracking-wide flex-1" style={{...TEKO}}>{phil.title}</h3>
              <ChevronLeft size={16} style={{color:C.gray, transform:expandedId===phil.id?"rotate(-90deg)":"rotate(180deg)", transition:"transform 0.2s"}}/>
            </div>
            <p className="text-sm leading-relaxed" style={{color:C.gray,...BARLOW}}>{phil.summary}</p>
            {expandedId === phil.id && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm leading-relaxed" style={{color:"rgba(255,255,255,0.85)",...BARLOW}}>{phil.explanation}</p>
              </div>
            )}
          </div>
        ))}

        {activeTab === "formations" && Object.entries(FORMATION_DATA).map(([formId, data]: [string, any]) => (
          <div key={formId} className="rounded-xl p-5" style={{background:C.sapphireDk,border:`1px solid ${C.borderSub}`}}>
            <h3 className="text-lg text-white font-bold tracking-wide mb-1" style={{...TEKO}}>{data.label}</h3>
            <p className="text-sm leading-relaxed" style={{color:C.gray,...BARLOW}}>{data.desc}</p>
          </div>
        ))}
      </main>
    </div>
  );
}

export default function App() {
  const [screen,setScreen]=useState<Screen | "fanzone_legacy">("login");
  const [legacyMode,setLegacyMode]=useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      // If user logs out, push to login
      if (!user || user.uid === "") {
        setScreen("login");
      } else {
        // If logged in, skip auth
        if (screen === "login") setScreen("dashboard");
      }
    });
    return () => unsub();
  }, [screen]);

  const C_2022 = {
    bg:        "#56042C", sapphire:   "#7a0640", sapphireDk: "#3d0220",
    sapphireSm:"#4a0425", red:        "#FEC310", redDk:      "#cca300",
    green:     "#16a34a", gray:       "#E8E0D6", white:      "#ffffff",
    border:    "rgba(255,255,255,0.15)", borderSub:"rgba(255,255,255,0.08)",
  };

  if (screen === "fanzone_legacy") {
    return <FanZoneScreen onBack={()=>setScreen("legacy")} theme={{mode:"2022", C: C_2022}}/>;
  }

  if (legacyMode && screen !== "legacy") setScreen("legacy");
  if (screen === "legacy") return <LegacyMode onSwitch={()=>{setLegacyMode(false);setScreen("dashboard");}} onNavigateFanZone={()=>setScreen("fanzone_legacy")}/>;

  return (
    <div className="bg-background text-foreground">
      {screen==="login"     && <AuthScreen     onContinue={()=>setScreen("dashboard")}/>}
      {screen==="dashboard" && <DashboardScreen onNavigateRoster={()=>setScreen("roster")} onNavigateTactical={()=>setScreen("tactical")} onToggleLegacy={()=>{setLegacyMode(true);setScreen("legacy");}} onNavigateFanZone={()=>setScreen("fanzone")} onNavigateDictionary={()=>setScreen("dictionary")} onNavigatePhilosophies={()=>setScreen("philosophies")} onNavigateFormations={()=>setScreen("formations")}/>}
      {screen==="roster"    && <RosterScreen   onBack={()=>setScreen("dashboard")}/>}
      {screen==="tactical"  && <TacticalScreen onBack={()=>setScreen("dashboard")}/>}
      {screen==="fanzone"   && <FanZoneScreen  onBack={()=>setScreen("dashboard")} theme={{mode:"2026", C}}/>}
      {screen==="dictionary"&& <KeyTermsScreen onBack={()=>setScreen("dashboard")}/>}
      {screen==="formations"&& <FormationsScreen onBack={()=>setScreen("dashboard")}/>}
      
      {/* Global Chatbot UI */}
      <Chatbot />
    </div>
  );
}
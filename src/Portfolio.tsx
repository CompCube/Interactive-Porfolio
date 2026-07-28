import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const PVERT=`varying vec3 vP;varying vec3 vN;void main(){vP=normalize(position);vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const PH=`uniform float u_t;uniform float u_hover;varying vec3 vP;varying vec3 vN;`;
const NS=`float h3(vec3 p){return fract(sin(dot(floor(p),vec3(127.1,311.7,74.7)))*43758.);}float ns(vec3 p){vec3 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(floor(p)),h3(floor(p)+vec3(1,0,0)),f.x),mix(h3(floor(p)+vec3(0,1,0)),h3(floor(p)+vec3(1,1,0)),f.x),f.y),mix(mix(h3(floor(p)+vec3(0,0,1)),h3(floor(p)+vec3(1,0,1)),f.x),mix(h3(floor(p)+vec3(0,1,1)),h3(floor(p)+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){return ns(p)*.5+ns(p*2.1+vec3(3.7,1.2,.8))*.25+ns(p*4.4+vec3(1.5,2.8,.4))*.125+ns(p*8.8+vec3(.9,1.4,2.1))*.0625;}`;
const PT2=`float ep=.012;vec3 pp=vP*5.;float nx=ns(pp+vec3(ep,0,0))-ns(pp-vec3(ep,0,0));float ny=ns(pp+vec3(0,ep,0))-ns(pp-vec3(0,ep,0));float nz=ns(pp+vec3(0,0,ep))-ns(pp-vec3(0,0,ep));vec3 bN=normalize(vN+vec3(nx,ny,nz)*2.2);vec3 sd=normalize(vec3(.55,.72,.45));float diff=max(dot(bN,sd),0.)*.85+.22;vec3 hd=normalize(sd+vec3(0,0,1));float spec=pow(max(dot(bN,hd),0.),60.)*.50;float fr=pow(1.-max(dot(normalize(vN),vec3(0,0,1)),0.),1.7);c*=diff;c+=vec3(1.,.94,.78)*spec;c+=rimC*fr*1.2;c*=(1.+u_hover*.4);gl_FragColor=vec4(c,1.);}`;
const PF={
  games:   PH+NS+`void main(){float t=u_t;vec3 p=vP*3.;float v=fbm(p+vec3(t*.04,0,0));vec3 c=mix(vec3(.12,.06,.18),vec3(.38,.22,.52),v);c=mix(c,vec3(.65,.50,.85),max(0.,v-.65)*3.2);c+=vec3(.30,.15,.55)*fbm(p*2.+vec3(0,0,t*.1))*.16;vec3 rimC=vec3(.62,.40,.88);`+PT2,
  vfx:     PH+NS+`void main(){float t=u_t;vec3 p=vP*4.;float v=fbm(p+vec3(t*.03,0,t*.025));vec3 c=mix(vec3(.12,.05,.10),vec3(.36,.16,.28),v);c=mix(c,vec3(.60,.32,.50),max(0.,v-.70)*3.8);c+=vec3(.42,.20,.38)*fbm(p*2.)*.12;vec3 rimC=vec3(.55,.22,.48);`+PT2,
  tools:   PH+NS+`void main(){vec3 p=vP*5.;float v=fbm(p);vec3 c=mix(vec3(.08,.08,.22),vec3(.26,.28,.58),v);c=mix(c,vec3(.42,.48,.82),max(0.,v-.72)*3.5);c+=vec3(.14,.16,.52)*fbm(p*2.)*.12;vec3 rimC=vec3(.30,.36,.88);`+PT2,
  environments:PH+NS+`void main(){float t=u_t;vec3 p=vP*3.;float v=fbm(p+vec3(t*.06,0,0));vec3 c=mix(vec3(.16,.06,.05),vec3(.44,.22,.18),v);c=mix(c,vec3(.72,.45,.35),max(0.,v-.72)*4.2);c+=vec3(.55,.24,.18)*fbm(p*2.+vec3(0,0,t*.12))*.25;vec3 rimC=vec3(.72,.30,.22);`+PT2,
  props:   PH+NS+`void main(){float t=u_t;vec3 p=vP*4.;float v=fbm(p+vec3(t*.1,0,0));vec3 c=mix(vec3(.26,.10,.04),vec3(.54,.24,.12),smoothstep(.2,.65,v));c=mix(c,vec3(.88,.55,.28),max(0.,.18-v)*5.5);c+=vec3(.88,.42,.14)*max(0.,.30-v)*1.5*(sin(vP.y*8.+t*2.)*.5+.5);vec3 rimC=vec3(.88,.44,.16);`+PT2,
  ai:      PH+NS+`void main(){float t=u_t;vec3 p=vP*3.;float v=fbm(p+vec3(0,t*.05,0));float pulse=fbm(p*2.5+vec3(0,0,t*.18))*.38;vec3 c=mix(vec3(.01,.14,.18),vec3(.05,.55,.68),v);c=mix(c,vec3(.28,.92,.99),max(0.,v+pulse-.78)*3.2);c+=vec3(.06,.60,.78)*pulse*.6;vec3 rimC=vec3(.06,.82,.98);`+PT2,
  web:     PH+NS+`void main(){float t=u_t;vec3 p=vP*4.;float v=fbm(p+vec3(t*.05,0,t*.03));vec3 c=mix(vec3(.04,.16,.10),vec3(.10,.45,.28),v);c=mix(c,vec3(.20,.72,.48),max(0.,v-.68)*3.5);c+=vec3(.08,.38,.22)*fbm(p*2.+vec3(0,t*.08,0))*.14;vec3 rimC=vec3(.18,.75,.48);`+PT2,
};
const NEBFRAG=`varying vec3 vD;float h3(vec3 p){return fract(sin(dot(floor(p),vec3(127.1,311.7,74.7)))*43758.);}float sm(vec3 p){vec3 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(floor(p)),h3(floor(p)+vec3(1,0,0)),f.x),mix(h3(floor(p)+vec3(0,1,0)),h3(floor(p)+vec3(1,1,0)),f.x),f.y),mix(mix(h3(floor(p)+vec3(0,0,1)),h3(floor(p)+vec3(1,0,1)),f.x),mix(h3(floor(p)+vec3(0,1,1)),h3(floor(p)+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){return sm(p)*.5+sm(p*2.1+vec3(3.7))*.25+sm(p*4.3+vec3(1.5,2.8,.4))*.125;}void main(){vec3 d=normalize(vD);float band=exp(-d.y*d.y*7.)*fbm(d*3.+vec3(1.5));float n1=fbm(d*2.+vec3(1.5,.3,.7));float n2=fbm(d*2.5+vec3(-1.2,1.8,-.4));float n3=fbm(d*1.8+vec3(.4,-.9,2.1));vec3 col=vec3(.005,.003,.014);col+=vec3(.003,.002,.02)*n1*n1;col+=vec3(.014,.002,.004)*n2*n2*.8;col+=vec3(.001,.007,.004)*n3*.55;col+=vec3(.028,.022,.045)*band;float core=fbm(d*3.+vec3(2.,1.,.5));col+=vec3(.008,.006,.022)*core*core*step(.6,core);gl_FragColor=vec4(col,1.);}`;
const VERT=`varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const FRAG=`uniform float u_t;varying vec3 vN;varying vec3 vP;vec3 h33(vec3 p){p=fract(p*vec3(443.897,397.297,491.187));p+=dot(p.zxy,p.yxz+19.19);return fract(p.xxy*p.yyz*p.zyx);}float vor(vec3 x,float t){vec3 n=floor(x),f=fract(x);float md=8.0;for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec3 g=vec3(float(i),float(j),float(k));vec3 o=h33(n+g);o=0.5+0.5*sin(t*0.3+6.28318*o);md=min(md,length(g+o-f));}return md;}void main(){float t=u_t;vec3 p=vP*5.0;float v1=vor(p,t),v2=vor(p*2.1+vec3(3.7,1.1,5.3),t*1.4),v3=vor(p*4.7+vec3(7.1,2.4,3.6),t*.75);float v=v1*.5+v2*.32+v3*.18;vec3 c=vec3(1.0,0.97,0.85);c=mix(c,vec3(1.0,0.78,0.12),smoothstep(0.0,0.38,v));c=mix(c,vec3(1.0,0.40,0.04),smoothstep(0.32,0.62,v));c=mix(c,vec3(0.5,0.08,0.01),smoothstep(0.55,0.88,v));float prm=smoothstep(0.6,0.15,v1)*(0.5+0.5*sin(vP.y*16.0+t*2.0));c+=vec3(0.6,0.2,0.0)*prm*0.7;float blu=smoothstep(0.75,0.25,v2)*(0.5+0.5*cos(vP.x*20.0+t*1.5));c+=vec3(0.05,0.15,0.9)*blu*0.12;float rim=dot(normalize(vN),vec3(0.0,0.0,1.0));c*=0.4+0.6*pow(max(rim,0.0),0.4);gl_FragColor=vec4(c*1.5,1.0);}`;

const gd=id=>`https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
const GH_USER="CompCube",GH_REPO="Interactive-Porfolio",GH_BRANCH="main";
const gh=path=>`https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/portfolio-media/${path}`;
const TARGET_DATE="2026-10-31T00:00:00";
const bgEnv="radial-gradient(ellipse at 50% 50%,#041408,#020a04)";
const bgTeal="radial-gradient(ellipse at 50% 50%,#041410,#020a08)";
const bgBlue="radial-gradient(ellipse at 50% 50%,#040a18,#020508)";
const bgSH="radial-gradient(ellipse at 50% 50%,#041422,#020a14)";
const bgIM="radial-gradient(ellipse at 50% 50%,#181200,#0c0c00)";
const bgN="radial-gradient(ellipse at 50% 50%,#120820,#060210)";
const bg0="radial-gradient(ellipse at 40% 60%,#001a22,#000810)";
const bg1="radial-gradient(ellipse at 50% 40%,#001824,#000810)";
const bg2="radial-gradient(ellipse at 60% 50%,#001020,#00060e)";

const HE_CATEGORIES=[
  {id:"introduction",label:"Introduction",icon:"📋",hex:"#66ccdd",
   text:"Hollow End is built around a simple creative challenge: can the environment itself become the main gameplay mechanic? Set inside an abandoned subway station, the game replaces combat with exploration, environmental puzzles, and decision-making, encouraging players to observe their surroundings rather than simply move through them.\n\nDrawing inspiration from real underground transit architecture, Hollow End transforms familiar spaces into unsettling ones through repetition, scale, lighting, and atmosphere. Structure is the foundation. Atmosphere is the goal.",
   subcategories:[
     {id:"core-idea",label:"Core Idea",imgs:[
       {label:"What is Hollow End?",src:null,bg:bg0,caption:"Hollow End is my Final Degree Project in Game Design and Development, created as an opportunity to push my skills in environment art, technical production, and real-time optimization toward the career I want to pursue: Technical Art.\n\nI've always been drawn to games that reward curiosity, puzzles, strategy, and worlds that invite players to stop, observe, and think. That led me to a simple idea: what if the space itself became the main mechanic? The answer took the form of an escape-room experience where progression depends on exploration and decision-making rather than traditional gameplay systems.\n\nBeyond making a game, I wanted to understand how professional studios build production-ready environments from scratch: from modular kits and material pipelines to optimization, shaders, lighting, and final implementation. Hollow End became the project through which I could explore every stage of that process."},
     ]},
     {id:"concepts-references",label:"Concepts, References & Inspiration",imgs:[
       {label:"Backrooms",src:null,bg:bg2,caption:"The Backrooms is an internet horror concept describing a seemingly infinite and surreal space detached from reality. Characterized by repetitive architecture, artificial lighting, and a subtle sense of unease, it transforms familiar environments into places that feel strangely wrong.\n\nRather than recreating the concept directly, I used its visual language as inspiration. Endless repetition, sterile architecture, and spaces stripped of context became the foundation for environments that feel believable, yet subtly disconnected from reality."},
       {label:"Liminal Spaces",src:null,bg:bg1,caption:"Liminal spaces are transitional environments that exist between destinations, empty schools, endless corridors, abandoned hospitals, or underground stations. Defined by ambiguity, unsettling silence, and a distinct atmospheric tension, these spaces often feel suspended in time.\n\nThis concept became one of the project's main design pillars, using silence, lighting, and emptiness to create discomfort and anticipation instead of relying on traditional horror resources."},
       {label:"U-Bahn (Berlin)",src:null,bg:"radial-gradient(ellipse at 50% 50%,#080a14,#040608)",caption:"Berlin's U-Bahn became the primary architectural reference for Hollow End. Its modular construction, clean geometry, and restrained visual language naturally translated into a reusable environment system capable of building large interconnected spaces while maintaining a strong sense of scale and realism.\n\nMore than 300 reference photographs were taken during a visit to Berlin, documenting materials, lighting, signage, wear, and transitional spaces. This research helped define the visual identity and proportions of the entire project."},
       {label:"Ghost Stations (Barcelona)",src:null,bg:"radial-gradient(ellipse at 55% 45%,#100808,#060404)",caption:"Barcelona's abandoned and inaccessible stations inspired the deteriorated areas of the game, introducing unfinished spaces and signs of long-term neglect. These environments reinforced the idea of familiar places stripped of their original purpose."},
     ]},
     {id:"game-feeling",label:"Game Feeling",imgs:[
       {label:"Kenopsia",src:null,bg:bg0,caption:"Kenopsia is the strange feeling of being in a place that is normally full of people but now stands completely empty: an abandoned hospital, a deserted school, or a silent subway station. Familiar and functional spaces suddenly feel unsettling simply because something is missing.\n\nThis idea became the emotional foundation of Hollow End, that aims to create tension through claustrophobia, silence, and subtle discomfort, placing the player in environments that feel believable yet slightly wrong, as if something beneath the surface has been forgotten."},
     ]},
   ]},
  {id:"narrative",label:"Narrative",icon:"📖",hex:"#cc88ff",
   text:"Hollow End tells its story entirely through the environment. There are no cutscenes, no dialogue, and almost no direct exposition. Instead, players uncover the station's history by exploring its spaces, observing what happened there, and piecing together the clues left behind.\n\nThe game is divided into two distinct narrative paths, each tied to a different side of the station. The Backroom follows a more surreal and unsettling logic, detached from conventional reality and shaped by repetition, isolation, and the unknown. In contrast, the Abandoned zone tells a more grounded story centered around the criminal group that took refuge within the station's decaying infrastructure.\n\nDepending on the path they choose, players gradually discover different fragments of the station's history and assemble their own understanding of what happened beneath the city.",
   subcategories:[
     {id:"story-setting",label:"Story & Setting",imgs:[
       {label:"Synopsis",src:null,bg:bgN,caption:"After a shift that felt endless, you board the last metro home. Exhausted and half-asleep, you barely notice the train has stopped until you look up and realize something is wrong. The station's name is missing, there's just a blank, faded sign, and no other passenger in sight. Your phone has no signal. The train doors remain open. Ahead of you, the end of the platform splits into two paths: the cold, artificial light of maintenance corridors that somehow are still running, or a stairwell descending into the darkness of the abandoned tracks.\n\nFrom that moment on, you are on your own. Every object you pick up, every clue you follow, and every choice you make shapes the story you will uncover, and determines whether you ever find your way back out or die trying."},
       {label:"Thematic Core",src:null,bg:"radial-gradient(ellipse at 50% 50%,#160a24,#080314)",caption:"Hollow End is built around the tension between fear and curiosity: the urge to keep exploring a place that offers every reason to turn back. That uncertainty reaches its peak in the Backroom, where the station no longer behaves like a real space and every answer raises new questions. In the end, Hollow End is not just about escaping, it's about questioning what is real in the first place."},
       {label:"Lore & World Context",src:null,bg:"radial-gradient(ellipse at 55% 45%,#140a22,#070314)",caption:"The station never worked correctly from the day it opened. Officially, it was closed due to persistent technical issues, electrical failures, and unexplained blackouts. Workers reported losing their sense of direction in corridors they knew by heart, while malfunctions appeared without any clear cause.\n\nOver time, the station was abandoned and fractured into two distinct states. One became the Backroom: clean, illuminated, and detached from conventional reality, where the space itself, and whatever inhabits it, became the main threat. The other fell into darkness and decay, gradually attracting a criminal group that used its isolation as a hideout and a place to record their crimes. Unlike the Backroom, here the danger is tangible and much closer than you might expect."},
       {label:"What Happened Here",src:null,bg:"radial-gradient(ellipse at 50% 60%,#1a0808,#0a0404)",caption:"The station's malfunction was never explained. Workers arrived late to shifts without knowing why. Blackouts happened on schedules that matched nothing in the electrical system. The closure was formal and quiet. What caused the spatiotemporal failure that turned part of the station into a Backroom is never stated. The criminal group arrived later, drawn by the isolation. The chains, the blood, the active security camera and the room with tools are theirs. The loop and the darkness predate them."},
       {label:"Why Two Story Paths?",src:null,bg:"radial-gradient(ellipse at 45% 55%,#0e0a1e,#05030f)",caption:"Hollow End features two distinct story paths that shape the player's experience from the very beginning, turning choice into one of the game's core mechanics. Beyond encouraging replayability, this structure allowed me to explore liminal spaces from two opposing perspectives: the surreal and detached logic of the Backroom, and the grounded decay of the Abandoned zone. By separating these environments into different narrative branches, the project expands beyond a single horror concept and explores how atmosphere, light, and space influence the way players experience fear.\n\nTwo paths, two stories, and two interpretations of liminal horror: one detached from reality, the other rooted in human decay. From the very beginning, players shape both their journey and their understanding of what lies beneath the city."},
     ]},
     {id:"env-storytelling",label:"Environmental Storytelling",imgs:[
       {label:"How Narrative is Delivered",src:null,bg:"radial-gradient(ellipse at 40% 50%,#100a1e,#060410)",caption:"Every piece of narrative in Hollow End is delivered through the environment itself. Notes, maintenance logs, graffiti, blood trails, and abandoned objects all serve a dual purpose: guiding the player while gradually revealing the station's history.\n\nA post-it with the combination to an electrical panel is also evidence of the station's dysfunction. A worker's diary explains the blackouts and disorientation, hinting that something was wrong long before the player arrived. In Hollow End, progression and storytelling are inseparable, the clues that unlock the next area are often the same clues that explain what happened there."},
       {label:"Plot Points",src:null,bg:"radial-gradient(ellipse at 50% 40%,#0e0818,#06040e)",caption:"Several moments reinforce this approach. Shortly after arriving at the station, the player reaches a central hall where the environment splits into two distinct paths: L2, the illuminated and sterile Backroom, and L1, the dark and decaying Abandoned zone. From the very beginning, the player's choice determines not only the route they will follow, but also the story they will experience.\n\nIn the Backroom, an abandoned chair chained to the floor and a lantern left behind suggest events that are never fully explained. In the Abandoned zone, the player uncovers traces of the criminal group that once occupied the station, gradually piecing together their story through the spaces they left behind.\n\nThe station keeps its secrets until the very end, leaving players to decide how much of what happened they truly understand."},
     ]},
     {id:"endings",label:"Endings",imgs:[
       {label:"Good Endings",src:null,bg:"radial-gradient(ellipse at 50% 45%,#0a1a0a,#040a04)",caption:"Three ways out of the station — Elevator, Ventilation, and Sewers — each reachable through a different combination of paths and choices. Escaping is possible, but never guaranteed: knowing the way out and surviving long enough to reach it are two different challenges."},
       {label:"Bad Endings: Zone 0 (Backroom)",src:null,bg:"radial-gradient(ellipse at 55% 45%,#140a22,#070314)",caption:"The Backroom rarely kills you outright — it traps you instead. Whether you're caught in an endless loop, lost in spaces that no longer follow the station's logic, or confronted by something that should not exist, every ending reflects the same unsettling idea: some places were never meant to be escaped."},
       {label:"Bad Endings: Hollow End (Abandoned Zone)",src:null,bg:"radial-gradient(ellipse at 50% 60%,#1a0808,#0a0404)",caption:"In the Abandoned zone, danger is immediate and tangible. Exposed wiring, flooded tunnels, and encounters with the wrong people turn every mistake into a consequence. Here, survival depends not on understanding the impossible, but on making the right choices before it's too late."},
     ]},
   ]},
  {id:"gameplay",label:"Gameplay & Level Design",icon:"🕹️",hex:"#aadd88",
   text:"Hollow End is a first-person horror game built around exploration, observation, and decision-making. There is no combat: the player can only move, interact with objects, and manage the station's systems. Tension and anxiety come from the environment itself and the threats hidden within the darkness.",
   subcategories:[
     {id:"core-loop",label:"Core Loop",imgs:[
       {label:"What the Player Does",src:null,bg:"radial-gradient(ellipse at 50% 40%,#0a1a04,#050e02)",caption:"The player explores an interconnected subway station in first person, collecting objects, solving environmental puzzles, and gradually unlocking new areas. Progression follows a simple principle: obstacles are introduced before their solutions, encouraging players to revisit familiar spaces with new information and tools.\n\nAs the game progresses, previously safe areas take on new meaning. Restoring power to the station, for example, unlocks the final elevator but also electrifies the flooded platform leading to it, forcing players to search for an alternative route. Elsewhere, a corridor that once served as a regular passage becomes a spatial trap, twisting into a looping sequence that can only be escaped by interpreting subtle changes in the environment.\n\nWhat begins as quiet exploration gradually turns into survival, as players are forced to rethink routes, manage resources, and adapt to an increasingly hostile station."},
       {label:"Progression Logic",src:null,bg:"radial-gradient(ellipse at 45% 55%,#081604,#040e02)",caption:"The game's difficulty unfolds in layers. The opening sections focus on exploration and spatial understanding, allowing players to learn the station's layout without immediate danger.\n\nHalfway through the experience, the rules change. Blackouts become a serious threat, enemies emerge, and spaces that once felt safe transform into places the player must survive."},
     ]},
     {id:"level-design",label:"Level Design",imgs:[
       {label:"Map Structure",src:null,bg:"radial-gradient(ellipse at 50% 50%,#081402,#050a02)",caption:"The station is split into two main sections: the surreal and mysterious Backroom, and the decaying Abandoned Zone. Both are composed of interconnected areas linked by puzzles, environmental hazards, and object dependencies rather than a linear sequence.\n\nWhile players are free to move throughout the station, progression relies on revisiting familiar spaces with new tools and information. For instance, restoring power unlocks the final elevator, but also electrifies the flooded platform, forcing players to find an alternative route through the underground labyrinth."},
       {label:"Zone & Subzone Design",src:null,bg:"radial-gradient(ellipse at 55% 45%,#091604,#04100a)",caption:"Each area was designed around the same three questions: what challenge does it introduce, what danger does it create, and what reward justifies the risk? Every zone serves a distinct gameplay purpose, gradually teaching new mechanics and transforming previously safe spaces into hostile ones."},
       {label:"Objects",src:null,bg:"radial-gradient(ellipse at 45% 55%,#0a1804,#06100a)",caption:"Every object in Hollow End belongs to one of two categories: interactables, which drive progression, and decorative props, more than 40 custom assets created to support atmosphere and environmental storytelling. Interactables are divided into three groups: static objects, which require specific conditions to activate; pickables, such as keys and tools that unlock new areas; and consumables, items designed to replenish the player's resources over time. Together, these systems connect exploration, puzzle-solving, and progression throughout the station."},
       {label:"Object-Driven Progression",src:null,bg:"radial-gradient(ellipse at 50% 60%,#081804,#040c02)",caption:"To avoid progression bottlenecks, key items are distributed across different zones and connected through chains of dependencies. Objects found in one area unlock paths in another, encouraging players to understand the station as an interconnected system rather than clearing each section one by one."},
       {label:"Spatial Pacing",src:null,bg:"radial-gradient(ellipse at 40% 60%,#091604,#040e02)",caption:"Tunnels, intersections, and open halls alternate to create a constant rhythm of compression and release. Inspired by the proportions of Berlin's U-Bahn, the station's low ceilings and elongated corridors generate claustrophobia through architecture alone.\n\nRather than using UI markers, navigation relies on environmental cues, using light, darkness, and subtle visual contrasts to guide the player without explicit markers. Deliberately lacking moments of relief, the station is designed to maintain tension from beginning to end."},
       {label:"Challenges",src:null,bg:"radial-gradient(ellipse at 50% 40%,#081202,#040e02)",caption:"Each of the station's three exits — Elevator, Ventilation, and Sewers — requires completing a different chain of interconnected objectives. Progression branches early and only converges near the end, meaning two players can reach the same ending after solving very different challenges.\n\nThe diagram displays the full dependency structure, showing how puzzles, items, and decisions connect throughout the station."},
     ]},
     {id:"mechanics",label:"Mechanics",imgs:[
       {label:"Light as the Main Resource",src:null,bg:"radial-gradient(ellipse at 55% 45%,#0a1802,#060e02)",caption:"Light is Hollow End's central gameplay system, influencing almost every decision the player makes throughout the game.\n\n**Survival:** The Backroom monster behaves differently depending on the lighting conditions, becoming more aggressive and faster in darkness and vulnerable in light.\n\n**Resource Management:** Five fuses control the station's electrical network and are essential to escaping, as restoring power is the only way to reactivate the elevator. However, every fuse activated shortens the time between blackouts, forcing players to carefully manage the system and minimize the risks created by darkness and environmental hazards.\n\n**Navigation:** Light replaces traditional markers, guiding players through puzzles and helping them identify the correct path in impossible spaces."},
     ]},
     {id:"design-challenges",label:"Design Challenges",imgs:[
       {label:"Balancing Linearity and Freedom",src:null,bg:"radial-gradient(ellipse at 50% 50%,#081402,#040e02)",caption:"The station needed to feel interconnected and explorable without becoming confusing or directionless. A fully open structure risked weakening both the tension and the narrative pacing, while a linear one would have undermined the feeling of being trapped in a real place. The final design combines free exploration with object dependencies that naturally guide players through the different zones."},
       {label:"Avoiding Progression Bottlenecks",src:null,bg:"radial-gradient(ellipse at 45% 55%,#0a1604,#050e02)",caption:"Early versions concentrated too many key items in the same area, creating repetitive backtracking. Progression was redesigned so that each objective depends on objects found elsewhere, encouraging players to move through the station as a whole rather than exhausting one zone at a time."},
       {label:"Making Light Readable Without Explicit UI",src:null,bg:"radial-gradient(ellipse at 55% 45%,#081804,#040c02)",caption:"Without a HUD or objective markers, light became responsible for communicating danger, progression, and navigation. The challenge was finding the right balance between clarity and ambiguity, ensuring that players could understand the station's systems while still feeling lost and uncertain."},
     ]},
   ]},
  {id:"game-art",label:"Game Art",icon:"🎨",hex:"#ff99cc",
   text:"All visual assets were created for Unity HDRP, combining two contrasting aesthetics built on the same underlying geometry: the sterile, over-lit unreality of the Backroom and the accumulated decay of the Abandoned zone.",
   subcategories:[
     {id:"references-identity",label:"References & Identity",imgs:[
       {label:"Moodboard",src:null,bg:"radial-gradient(ellipse at 50% 50%,#1a0c14,#0a060a)",caption:"The moodboard combines real-world transit architecture with liminal and institutional references, exploring repetition, scale, and controlled lighting. Created before production began, it helped define both the structural language of the environment and the overall atmosphere of Hollow End."},
       {label:"Reference Images",src:null,bg:"radial-gradient(ellipse at 45% 55%,#1a0e10,#0a0608)",caption:"During a trip to Berlin, I documented several U-Bahn stations through more than 300 reference photographs. These images guided the project throughout development, helping establish the aesthetic, scale, proportions, and architectural details of the station."},
       {label:"Color Palette & Identity — Backroom",src:null,bg:"radial-gradient(ellipse at 50% 50%,#0a1810,#04100a)",caption:"The Backroom is defined by a cold, desaturated green palette. Although green is often associated with life, it has also been widely used in film and games to evoke mystery, corruption, and a sense that something is fundamentally wrong. Here, it reinforces both the unnatural nature of the space and the uncertainty surrounding it."},
       {label:"Color Palette & Identity — Abandoned Zone",src:null,bg:"radial-gradient(ellipse at 55% 45%,#0a1018,#04080e)",caption:"The Abandoned zone is built around blue and white tones. White improves readability in dark, confined spaces, while blue emphasizes coldness and isolation. Together, they create an environment that feels both believable and unsettling."},
     ]},
     {id:"environment-art",label:"Environment",imgs:[
       {label:"Working Methodology",src:null,bg:bgEnv,caption:"A custom production pipeline was defined to build a photorealistic environment with limited resources while maximizing modular reuse: **references → concept sketches → color palette → trim sheets → modular kit → texturing → export**. Material planning and modular design were developed together from the start to reduce repetition and avoid costly rework later in production."},
       {label:"Trim Sheets — Backroom",src:null,bg:"radial-gradient(ellipse at 50% 50%,#0e1a08,#061004)",caption:"Five 4096px trim sheets were created for the Backroom's walls, floors, and ceilings. Multiple iterations were explored to balance repetition, readability, and material variation while maintaining a coherent visual identity."},
       {label:"Trim Sheets — Abandoned Zone",src:null,bg:"radial-gradient(ellipse at 45% 55%,#1a1608,#0e0c04)",caption:"Starting from the same base textures, four progressively degraded material variants were created to represent different stages of wear and decay. Mixing these variations throughout the environment increases visual diversity while preserving a consistent architectural language."},
       {label:"Modular Kit — Reuse & Adaptation",src:null,bg:"radial-gradient(ellipse at 55% 45%,#141a08,#0a1004)",caption:"The Abandoned zone reuses almost the entire modular kit from the Backroom, reinforcing the idea that both spaces belong to the same station. New pieces were added only when required by gameplay or visual identity, always remaining compatible with the original system."},
     ]},
     {id:"props",label:"Props",imgs:[
       {label:"Modeling Workflow",src:null,bg:"radial-gradient(ellipse at 50% 50%,#1a0c04,#0a0602)",caption:"Every prop follows the same production pipeline: **low-poly blockout → high-poly detailing → UV unwrapping → texturing → export to Unity**. High-poly meshes were created using subdivision, bevel modifiers, and optional sculpting, while vertex painting was used selectively to drive material masks in Substance Painter. The example shown compares an asset with 8,131 polygons to its 1.5 million polygon high-poly counterpart."},
       {label:"Two-Version System",src:null,bg:"radial-gradient(ellipse at 45% 55%,#1a1004,#0e0802)",caption:"Every prop exists in two different states: New, used in the Backroom, and Abandoned, used in the realistic zone. While both versions share the same geometry, each required its own texturing pass, material setup, and visual language to match the atmosphere of its environment."},
       {label:"Texture Atlasing & Material Efficiency",src:null,bg:"radial-gradient(ellipse at 55% 45%,#180e04,#0c0602)",caption:"To reduce draw calls and material count, props were grouped into shared texture atlases instead of receiving unique materials. In total, 35 custom assets use only 7 materials, while 45 imported props were condensed into 15, resulting in 90 prefabs across both environments."},
       {label:"Asset Catalog",src:null,bg:"radial-gradient(ellipse at 50% 60%,#1a0e06,#0a0602)",caption:"The project contains +35 custom props organized by gameplay function — decorative, interactable, pickable, consumable, and static objects — alongside several modular variants such as signage systems and key interactables including the elevator, fuse box, flashlight, and lever."},
     ]},
     {id:"customization",label:"Asset Customization & Easter Eggs",imgs:[
       {label:"Asset & Material Customization",src:null,bg:"radial-gradient(ellipse at 50% 50%,#100a1a,#06040e)",caption:"Assets and materials were heavily customized through layered dirt, dust, and debris generators, together with material parameter adjustments, to create a worn, believable look while maximizing visual variety across the environment."},
       {label:"Environmental Storytelling",src:null,bg:"radial-gradient(ellipse at 45% 55%,#140a1c,#08040e)",caption:"Selected props feature traces of past events — blood stains, abandoned objects, and signs of struggle — hinting that others attempted to escape the station long before the player arrived."},
       {label:"Diegetic Signage",src:null,bg:"radial-gradient(ellipse at 55% 45%,#0c0a1a,#04040e)",caption:"Signs, maps, and line indicators were redesigned to follow the station's internal logic, reinforcing both navigation and the overall visual identity of the environment."},
       {label:"Personal Easter Eggs",src:null,bg:"radial-gradient(ellipse at 50% 60%,#100c1a,#06040e)",caption:"In order to add small personal details hidden throughout the environment, several station names and metro stops are subjects from my degree."},
     ]},
   ]},
  {id:"vfx",label:"VFX & Shaders",icon:"✨",hex:"#aaccff",
   text:"Custom shaders and VFX in Hollow End are designed to support both gameplay and atmosphere. Rather than serving a purely decorative role, every visual system communicates information, reinforces the game's themes, or interacts directly with the player.",
   subcategories:[
     {id:"shaders",label:"Shaders",imgs:[
       {label:"Retro Screen Shader",src:null,bg:bgSH,caption:"Inspired by the vintage aesthetic commonly associated with Backrooms imagery, this shader adds a subtle VHS-like filter during specific moments in the Backroom. Beyond its visual style, it reinforces the feeling that the space is detached from reality."},
       {label:"Vignette Shader",src:null,bg:"radial-gradient(ellipse at 45% 55%,#0e1420,#060a12)",caption:"A custom vignette effect used to strengthen the sense of isolation and claustrophobia. By darkening the edges of the screen and drawing attention toward the center, it subtly increases tension without interfering with gameplay readability."},
       {label:"Water Shader",src:null,bg:"radial-gradient(ellipse at 50% 50%,#081826,#040c14)",caption:"A custom water material integrated with HDRP volumetric lighting to simulate flooded areas throughout the station. Beyond its visual role, water becomes a gameplay element once electricity is restored, transforming safe routes into hazards."},
       {label:"Outline Shader",src:null,bg:"radial-gradient(ellipse at 55% 45%,#0a1422,#050a14)",caption:"Interactable objects are highlighted using an animated outline system that does not modify their original materials. Color, thickness, and animation change depending on the object's state, allowing players to distinguish available interactions from inaccessible ones at a glance."},
     ]},
     {id:"vfx-systems",label:"VFX Systems",imgs:[
       {label:"HDRP & Volumetric Effects",src:null,bg:"radial-gradient(ellipse at 45% 55%,#041422,#020a14)",caption:"The atmosphere relies heavily on HDRP features such as volumetric fog, real-time lighting, bloom, and ambient occlusion. These effects create depth in dark corridors, enhance the contrast between illuminated and abandoned areas, and allow the dynamic blackout system to affect the entire station in real time."},
     ]},
   ]},
  {id:"technical",label:"Technical Implementation",icon:"💻",hex:"#ffdd88",
   text:"Beyond its visual design, Hollow End is built on a collection of interconnected gameplay systems developed specifically for the project. From spatial portals and shared interaction logic to dynamic lighting, enemy AI, and blackout management, every mechanic is designed to support the same goal: turning the environment itself into the main gameplay system. This section explores the technical implementation behind those systems.",
   subcategories:[
     {id:"hdrp-pipeline",label:"HDRP Pipeline",imgs:[
       {label:"Lighting Setup",src:null,bg:bgIM,caption:"Real-time lighting throughout, made necessary by the dynamic blackout system: lights that switch on and off cannot use baked data. The Backroom uses cold fluorescent green light. The Abandoned zone uses broken, flickering lights and total darkness. A small number of high-intensity volumetric light sources creates more atmosphere than uniform illumination across the space. Emissive materials on fluorescent fixtures interact with Bloom in post-processing."},
       {label:"HDRP Features",src:null,bg:"radial-gradient(ellipse at 45% 55%,#1a1400,#0e0c00)",caption:"Active features: Volumetric Fog, Volumetric Lighting, Ambient Occlusion, Bloom, full HDRP post-process stack including custom Renderer Features for the Retro Screen and Vignette shaders. Normal maps imported at 4096px, requiring manual resolution cap increase in Unity from the default 2048 and explicit Normal Map texture type configuration to avoid lighting errors."},
     ]},
     {id:"core-systems",label:"Core Systems",imgs:[
       {label:"Portals",src:null,bg:"radial-gradient(ellipse at 50% 45%,#1a1400,#0e0c00)",caption:"Portals create disorientation and simulate spatial loops within the Backroom. Entry and exit points are designed to look identical, making transitions feel seamless while also acting as safe zones the monster cannot cross.",details:"A PortalTeleporter detects the player through trigger colliders and recalculates their position using local-space transforms to preserve orientation and movement. The CharacterController is temporarily disabled during teleportation to avoid physics issues, while a cooldown system prevents consecutive teleports. Portals used in the final trap report their state to a dedicated controller, distinguishing correct and incorrect paths."},
       {label:"Interactables",src:null,bg:"radial-gradient(ellipse at 50% 55%,#181200,#0c0c00)",caption:"Doors, panels, pickups, and mechanisms all share the same interaction framework, allowing gameplay logic to be written once and reused across the entire project.",details:"All interactables implement a common IInteractable interface, providing shared methods for interaction, focus events, prompts, and availability checks. More complex objects extend this system with inventory requirements, allowing doors, mechanisms, and pickups to share the same interaction framework. Object state is communicated through the outline system, whose colours indicate whether an interaction is currently possible, removing the need for traditional UI."},
     ]},
     {id:"player-enemy",label:"Player & Enemy",imgs:[
       {label:"Player",src:null,bg:"radial-gradient(ellipse at 50% 45%,#1a1600,#0e0c00)",caption:"A first-person controller designed around immersion, combining responsive movement, environmental interaction, and subtle camera effects.",details:"Built on Unity's CharacterController and the new Input System. Camera pitch and body rotation are handled independently: vertical input affects only the camera, while horizontal input rotates the player to preserve natural movement. Jumping uses a raycast-based ledge check, designed specifically for transitions between platforms and rails. Immersion is reinforced through a speed-driven head-bob system and contextual footstep audio that changes dynamically between normal and flooded surfaces."},
       {label:"Monster",src:null,bg:"radial-gradient(ellipse at 55% 50%,#181000,#0c0800)",caption:"The enemy is built entirely around the game's core mechanic: light. Every light source in the station influences its behaviour through a single, scalable system.",details:"Movement relies on Unity's NavMeshAgent, with speed interpolated smoothly during pursuit. Instead of processing individual lights, the monster relies on dedicated slow-zone colliders: entering a lit area applies a configurable speed multiplier that is gradually restored on exit. This decoupled system is shared by both station lights and the player's flashlight, ensuring consistent behaviour while scaling efficiently to hundreds of lights. The enemy is currently represented by a placeholder mesh, with the final model planned for a later development phase."},
     ]},
     {id:"light-blackout",label:"Light & Blackout Systems",imgs:[
       {label:"Light Control Hierarchy",src:null,bg:"radial-gradient(ellipse at 50% 50%,#1a1400,#0e0c00)",caption:"Because light drives both gameplay and atmosphere, the project required a hierarchical system capable of managing anything from a single bulb to the entire station.",details:"The lighting architecture is built as a layered system, allowing gameplay events to affect anything from a single bulb to the entire station without duplicating logic.\n\n**LightController** — The base unit, managing a single light and its optional trigger zone. Handles activation, flickering, material swapping, and both instant and interpolated intensity changes.\n\n**LightManager** — Groups multiple LightControllers within the same area, allowing an entire zone to react simultaneously to gameplay events.\n\n**FusibleController** — Controls a zone's fuse, handling player interaction, animations, and permanent failures (used in the abandoned labyrinth, which remains dark by design).\n\n**LightBox** — The central fuse panel of the station. It randomly assigns one broken fuse at the start of each run and reports every state change to the GameManager."},
       {label:"Blackout Mechanic & Game Manager",src:null,bg:"radial-gradient(ellipse at 45% 55%,#1a1000,#0c0800)",caption:"Electricity is both a resource and a threat: restoring power unlocks progression, but also accelerates blackouts, all coordinated through a centralized management system.",details:"Blackout timing scales dynamically with the number of active fuses (1 fuse → 6 min, 2 → 4 min, 3 → 2 min, 4+ → 1 min). Activating or deactivating a fuse adjusts the remaining time instead of resetting the timer, preventing players from exploiting the system. In parallel, the GameManager drives periodic flickers and progressively reduces light intensity as the next blackout approaches, building tension without relying on visible timers or UI.\n\nThe GameManager also centralizes all game-over conditions. Any system can trigger it with a custom death message, while it handles cursor release, time reset, and scene transitions regardless of the cause — whether it is the monster, electrified water, or complete darkness."},
     ]},
     {id:"optimization",label:"Optimization",imgs:[
       {label:"Performance Decisions",src:null,bg:"radial-gradient(ellipse at 50% 50%,#181200,#0c0c00)",caption:"Occlusion Culling applied to all modular kit prefabs and all 45 props, with camera culling configured across the full map. Static batching enabled through material sharing across modular kit instances. Decorative elements integrated directly inside tunnel prefabs rather than placed individually, allowing draw call control at prefab level. Five trim sheets cover 70+ modular pieces in the Backroom zone. Fifteen materials texture 45 assets across 90 prefabs in two versions each."},
     ]},
   ]},
  {id:"results",label:"Results",icon:"🚀",hex:"#ffaa88",
   text:"Hollow End was submitted as a final degree project at Universitat de Girona in 2025, targeting a Steam and itch.io release in October 2026.",
   links:[{label:"Wishlist on Steam",href:"#",icon:"🎮"},{label:"View on Itch.io",href:"#",icon:"🎯"}],
   subcategories:[
     {id:"final-shots",label:"Final Shots",imgs:[{label:"Final Shots",src:null,bg:"radial-gradient(ellipse at 50% 50%,#050510,#020208)",caption:"Coming soon - in-engine captures at full fidelity with lighting, post-processing and props in place."}]},
     {id:"trailer",label:"Trailer / Video",imgs:[{label:"Trailer",src:null,bg:"radial-gradient(ellipse at 50% 50%,#080510,#040208)",caption:"Coming soon."}]},
     {id:"tfg",label:"TFG & Recognition",imgs:[{label:"TFG Recognition",src:null,bg:"radial-gradient(ellipse at 50% 50%,#0a0510,#050208)",caption:"Hollow End was submitted as a Final Degree Project at Universitat de Girona in 2025 and awarded Matrícula d'Honor (High Honours). Jury feedback coming soon."}]},
   ]},
];

const STAR={hex:"#EDC32B",name:"JORDI",
bio:"Game Developer and Technical Artist from Barcelona with experience building real-time pipelines and tools in Unity. My background combines Computer Engineering and a Bachelor's degree in Game Design and Development at the University of Girona, where I discovered my focus at the intersection of art and engineering. I specialize in Unity HDRP workflows, VFX, environment art, and C# tooling, with a strong interest in improving production efficiency through custom tools and scalable pipelines.",
bioExtended:"Game Developer and Technical Artist from Barcelona with a strong focus on real-time pipelines, Unity HDRP production workflows, and technical problem-solving across environment art and VFX systems. I started in Computer Engineering in Girona, but after one year I realized I was more interested in creating interactive experiences than working on abstract systems. That led me to switch to Game Design and Development at the University of Girona, where I spent five years working across programming, game design, 3D art, level design, and technical implementation, gradually shaping a multidisciplinary approach.\n\nA key turning point came from a Riot Games talk on Technical Art, which clarified the role I had naturally been moving toward: bridging art and engineering to ensure both visual quality and technical performance. Since then, I've focused on that intersection through Unity (especially HDRP), Blender (3,000+ hours), Substance 3D Painter, and C# development. My Final Degree Project, Hollow End, brought all of this together as a solo photorealistic horror game featuring custom tools, VFX systems, shaders, modular environment pipelines, and full production ownership, earning High Honors in 2025.\n\nOutside of game development, I enjoy exploring disciplines that push me to think differently. I'm naturally curious and tend to move across creative and technical spaces, from piano and languages to web development, AI experiments, and side projects that start with curiosity and usually end with me going far too deep into them. While this portfolio focuses on games, I believe those interests shape the way I work: staying adaptable, connecting ideas across fields, and constantly learning. My goal is to join a studio as a Technical Artist and keep growing alongside talented teams, building better tools, workflows, and experiences over time.",
skills:[{s:"Unity / C#",p:88},{s:"Blender / 3D Art",p:86},{s:"Shader Graph / VFX",p:80},{s:"Substance 3D Painter",p:78},{s:"Game Design",p:85},{s:"React / Web",p:76},{s:"Python / AI",p:72},{s:"Git",p:82}],
langs:[{l:"Catalan",lv:"Native"},{l:"Spanish",lv:"Native"},{l:"English",lv:"C1"},{l:"Italian",lv:"B1"},{l:"German",lv:"B1 (learning)"}],
timeline:[{y:"2019",l:"Computer Engineering",d:"One year. Not the right path, but an important signal."},{y:"2020",l:"Game Design & Dev · UdG",d:"Moved to Girona. Five years building interactive experiences."},{y:"2022",l:"Internship · ServiceNow",d:"Enterprise apps for Santander, CaixaBank, Europastry, AEMET."},{y:"2023",l:"Technical Art realization",d:"A Riot Games video made everything click."},{y:"2024",l:"Hollow End begins",d:"Final degree project · solo HDRP first-person horror game."},{y:"2025",l:"Graduation · High Honors",d:"Matrícula d\'Honor · University of Girona."},{y:"2026",l:"Steam release",d:"Hollow End · planned Q4 2026."}]};

const PLANETS=[
  {id:"props",label:"Props",icon:"🧱",hex:"#C79CD9",orbitRadius:8,orbitSpeed:.006,startAngle:3.5,radius:.62,desc:"Game-ready prop kits.",moons:[
    {id:"subway-props-kit",label:"Subway Props Kit",icon:"📦",orbitRadius:1.7,orbitSpeed:.014,startAngle:2.5,inclination:-.24,radius:.24,hex:"#d99f88",
      type:"Game-Ready Props",status:"",devPct:null,
      desc:"A collection of **80+ optimized game-ready props** created for **Hollow End** using a **low-poly to high-poly production workflow**, **texture atlases**, and a scalable asset pipeline tailored for large **Unity HDRP** environments. Each prop was designed with both **clean and abandoned variants**, allowing the same asset library to be reused across multiple locations while supporting environmental storytelling and reducing production overhead.",
      tags:["Unity","HDRP","Blender","3D Art","PBR","Substance 3D Painter"],
      features:["Low-poly to high-poly workflow","80+ game-ready assets","14 shared texture atlases","Strict polygon budget per category","Unity HDRP compatible","Based on 300+ real reference photos"],
      imgs:[],cta:"View on ArtStation",
      categories:[
        {id:"props",label:"Props",caption:"A collection of environment props created to populate the different areas of *Hollow End's* subway station. Assets were designed with clear complexity targets to balance visual quality and scalability:\n\n• **Small props (300–500 tris)**\n• **Medium props (500–2,000 tris)**\n• **Hero assets (2,000–5,000 tris).**",imgs:[{label:"Various Old",src:gd("1jmy-Y6FaGikQz5nak32qwymNsLZift0n")},{label:"Various New",src:"https://res.cloudinary.com/dr4hp18nh/image/upload/v1780611743/new_xaxlai.png"},{label:"Posters Old",src:gd("1jgnglczIGFRJUE2SseHzoNnGRHSc-LYz")},{label:"Posters New",src:gd("1F2jy4CfjXtoGbNf-z1lkiZwNyH3EBV74")}],videoId:null},
        {id:"reference",label:"References",caption:"During a trip to Berlin, I collected **300+ reference photos** across multiple U-Bahn stations, focusing on architecture, lighting, materials, signage, wear, and transitional spaces. These references became the visual foundation for shaping the atmosphere and environmental language of *Hollow End*.",imgs:[{label:"Reference Images",src:gd("1OC3EYBdZsgheHM-zj0gK8KTPSXaXx6c7")},{label:"Berlin U-Bahn",src:gd("1bT1GiVG-jnW3nf5MVgU5wJ0u-lsWxogI")}],videoId:null},
        {id:"atlases",label:"Atlases",caption:"To reduce material count and improve rendering performance, props were organized into **shared texture atlases** based on **environment zone and asset reuse frequency**. The final setup consisted of **14 texture atlases** supporting **80+ dual-versioned props**, improving batching efficiency while maintaining visual consistency across the environment.",imgs:[{label:"Texture Atlas 1",src:gd("14jYcSL1vZCnp9XfcaBJlQDYR7Eo4mcrS")},{label:"Texture Atlas 2",src:gd("1aaXfbTXA2zvv_8T7RKS4TfAR5fu7kV2v")}],videoId:null},
        {id:"results",label:"Results",caption:"Final integration of the prop set across both *Hollow End* environments: **L1 (Abandoned)** and **L2 (New)**. Using the same shared asset library, each space achieves a **distinct visual identity** through material variation, lighting and environmental dressing.",imgs:[{label:"L2 — View 1",src:gd("1A9wfaqn1LkuszRtDCBrpXLFBscfIC4U2")},{label:"L2 — View 2",src:gd("1Qnye20j8pV88D5j9ug3howC7pvip3xtP")}],videoId:null},
      ]},
  ]},
  {id:"environments",label:"Environments",icon:"🌍",hex:"#9A89D9",orbitRadius:13,orbitSpeed:.004,startAngle:1.8,radius:.74,desc:"Modular environment kits for Unity HDRP.",moons:[
    {id:"subway-modular-kit",label:"Subway Modular Kit",icon:"🏗️",orbitRadius:2.1,orbitSpeed:.011,startAngle:.8,inclination:.16,radius:.26,hex:"#c4948e",
      type:"Environment Art",status:"",devPct:null,
      desc:"The structural foundation of *Hollow End* is built from a **reusable modular kit** designed to create **large interconnected subway environments** in Unity HDRP. The same geometry constructs both **The Backroom (L2)** and **The Abandoned Zone (L1 & L3)**, with distinct identities achieved through materials, lighting, and environmental dressing instead of additional meshes.",
      tags:["Blender","Unity HDRP","Modular Kit","Substance 3D Painter","Trim Sheets","Liminal Space","Backrooms"],
      features:["78 modular pieces covering full environmental construction","9 trim sheets with progressive degradation variants","4096px trim sheets at 512 px/m texel density","Two complete environments: Backroom & Abandoned","Material-driven variation using a single UV framework"],
      imgs:[{label:"Render",src:gh("environments/subway-modular-kit/01-render1.png"),bg:bgEnv}],cta:"View on ArtStation",
      categories:[
        {id:"core-idea",label:"CORE IDEA",hex:"#bb8880",
         imgs:[
           {label:"Liminal Space",src:gh("environments/subway-modular-kit/core-idea/02-liminalspace.jpg"),bg:"radial-gradient(ellipse at 50% 70%,#081414,#040808)"},
           {label:"Backrooms",src:gh("environments/subway-modular-kit/core-idea/01-backrooms.jpg"),bg:"radial-gradient(ellipse at 50% 30%,#0a1a10,#040a06)"},
         ],
         text:"*Hollow End* was built around a simple production challenge: create multiple narrative environments from a single modular kit without duplicating geometry. Instead of relying on unique assets for each level, the project focuses on reuse, allowing materials, lighting, and environmental dressing to define each space while the underlying structure remains the same.",
         subcategories:[
           {id:"concepts",label:"Concepts",imgs:[
             {label:"Liminal Spaces",src:gh("environments/subway-modular-kit/core-idea/concepts/01-liminal-spaces.png"),bg:"radial-gradient(ellipse at 50% 70%,#081414,#040808)",caption:"Liminal spaces became one of the project's main design pillars. Empty corridors, platforms, and transitional spaces were used to create unease through **atmosphere, lighting** and **silence** instead of relying on traditional horror elements."},
             {label:"Backrooms",src:gh("environments/subway-modular-kit/core-idea/concepts/02-backrooms.png"),bg:"radial-gradient(ellipse at 50% 30%,#0a1a10,#040a06)",caption:"The Backrooms is an internet horror concept describing a seemingly **infinite, surreal space** detached from reality. In *Hollow End*, the goal was to create spaces that feel familiar enough to be believable, yet subtly disconnected from reality."},
           ]},
           {id:"moodboard-refs",label:"Moodboard & References",imgs:[
             {label:"U-Bahn (Berlin)",src:gh("environments/subway-modular-kit/core-idea/moodboard-refs/01-berlinsubahn.png"),bg:"radial-gradient(ellipse at 40% 60%,#0a0a18,#040408)",caption:"Berlin's U-Bahn became the **primary architectural reference** for the project. Its modular construction, clean geometry, and restrained visual language naturally translated into a reusable environment system."},
             {label:"Ghost Stations (Barcelona)",src:gh("environments/subway-modular-kit/core-idea/moodboard-refs/02-barcelonasgohststation.png"),bg:"radial-gradient(ellipse at 60% 40%,#100808,#080404)",caption:"Barcelona's abandoned and inaccessible stations inspired the deteriorated areas of the game, introducing unfinished spaces and signs of long-term neglect."},
             {label:"Moodboard",src:gh("environments/subway-modular-kit/core-idea/moodboard-refs/03-moodboard.png"),bg:"radial-gradient(ellipse at 50% 50%,#080a14,#040608)",caption:"The moodboard combines real-world transit architecture with liminal horror references, establishing a clear visual language before production began and guiding every design decision throughout development."},
           ]},
           {id:"game-feeling",label:"Game Feeling",imgs:[
             {label:"Kenopsia",src:gh("environments/subway-modular-kit/core-idea/game-feeling/01-kenopsia.png"),bg:"radial-gradient(ellipse at 50% 50%,#060c0a,#030604)",caption:"The atmosphere of *Hollow End* is built around **Kenopsia**: the unsettling feeling of **a place that should be full of life but is now completely empty**. Rather than relying on monsters or jump scares, the environment creates tension through silence, familiarity, and the absence of people."},
           ]},
         ]},
        {id:"trim-sheets",label:"TRIM SHEETS & MATERIALS",hex:"#88aadd",
         imgs:[{label:"Trim Sheets",src:gh("environments/subway-modular-kit/trim-sheets/01-trimsheets.png"),bg:"radial-gradient(ellipse at 50% 50%,#0a1220,#04081a)"}],
         text:"The material pipeline was defined **before any modeling began**. By designing the trim sheets first, every asset could share the same UV logic from the start, ensuring consistent texel density, reducing material count, and keeping the entire environment scalable through a **unified material framework**.",
         subcategories:[
           {id:"first-attempts",label:"First Attempts",imgs:[
             {label:"Backroom Iterations",src:gh("environments/subway-modular-kit/trim-sheets/first-attemps/01-backrooms.png"),bg:"radial-gradient(ellipse at 45% 55%,#040c1a,#020608)",caption:"Finding the right balance between repetition and readability required several iterations. Early versions either felt too noisy or too uniform, leading to multiple refinements before arriving at a trim sheet that remained **modular without becoming visually repetitive**."},
             {label:"Abandoned Iterations",src:gh("environments/subway-modular-kit/trim-sheets/first-attemps/02-abandoned.png"),bg:"radial-gradient(ellipse at 55% 45%,#030a14,#020508)",caption:"For the Abandoned Zone, the main challenge wasn't adding damage — it was making **deterioration feel natural** while preserving the modular workflow. Several iterations focused on balancing wear, rust, and water damage without breaking consistency across large connected surfaces."},
           ]},
           {id:"final-trimsheets",label:"Final Trim Sheets",imgs:[
             {label:"Backroom Trim Sheets",src:gh("environments/subway-modular-kit/trim-sheets/final-trimsheets/01-l2-trimsheets.png"),bg:"radial-gradient(ellipse at 55% 45%,#040a18,#020508)",caption:"The final Backroom trim sheets prioritize **clean surfaces, subtle variation, and controlled repetition**, reinforcing the sterile and artificial atmosphere while remaining highly reusable across the environment."},
             {label:"Abandoned Trim Sheets",src:gh("environments/subway-modular-kit/trim-sheets/final-trimsheets/02-abandoned.png"),bg:"radial-gradient(ellipse at 50% 50%,#180a06,#0c0504)",caption:"The Abandoned trim sheets build upon the **same UV framework**, introducing progressive surface wear, rust, and water damage without requiring any changes to the underlying geometry.\n\nTo break visual repetition while keeping the geometry and material workflow unchanged, **four material variants** were derived from a single base trim sheet to represent different stages of aging and environmental wear."},
           ]},
         ]},
        {id:"modular-kit",label:"MODULAR KIT SYSTEM",hex:"#7abba8",
         imgs:[{label:"Full Modular Kit",src:gh("environments/subway-modular-kit/modular-kit/01-fullmodularkit.png"),bg:"radial-gradient(ellipse at 50% 50%,#0a1a14,#040a08)"}],
         text:"The Modular Kit is the **structural backbone** of *Hollow End*, consisting of **78 reusable pieces** used to construct every playable environment. Organized into two main sets (New and Abandoned) and built around a strict **4-meter grid**, the system ensures predictable snapping, consistent UV layouts, and a uniform texel density across the entire project.\n\nRather than creating unique assets for each area, the kit prioritizes **modularity and reuse**. The same geometry supports multiple environments, with materials, lighting, and environmental dressing providing each space with its own visual identity.",
         subcategories:[
           {id:"backroom-l2",label:"Backroom (L2)",imgs:[
             {label:"Walls",src:gh("environments/subway-modular-kit/modular-kit/backroom-l2/01-walls.png"),bg:"radial-gradient(ellipse at 50% 50%,#0a1a0a,#040a04)",caption:"The Backroom showcases the modular system in its purest form. Clean materials, uniform lighting, and repetitive architectural elements intentionally expose the underlying structure, reinforcing the **artificial and unsettling atmosphere** of the space."},
             {label:"Floors",src:gh("environments/subway-modular-kit/modular-kit/backroom-l2/02-floors.png"),bg:"radial-gradient(ellipse at 45% 55%,#081a08,#040a04)",caption:"The Backroom showcases the modular system in its purest form. Clean materials, uniform lighting, and repetitive architectural elements intentionally expose the underlying structure, reinforcing the **artificial and unsettling atmosphere** of the space."},
             {label:"Full Modular Kit",src:gh("environments/subway-modular-kit/modular-kit/backroom-l2/03-fullmodularkit.png"),bg:"radial-gradient(ellipse at 55% 45%,#0a1c0a,#040c04)",caption:"The Backroom showcases the modular system in its purest form. Clean materials, uniform lighting, and repetitive architectural elements intentionally expose the underlying structure, reinforcing the **artificial and unsettling atmosphere** of the space."},
             {label:"Pieces",src:gh("environments/subway-modular-kit/modular-kit/backroom-l2/04-pieces-1.png"),bg:"radial-gradient(ellipse at 50% 60%,#081808,#040a04)",caption:"The Backroom showcases the modular system in its purest form. Clean materials, uniform lighting, and repetitive architectural elements intentionally expose the underlying structure, reinforcing the **artificial and unsettling atmosphere** of the space."},
             {label:"Pieces",src:gh("environments/subway-modular-kit/modular-kit/backroom-l2/05-pieces-2.png"),bg:"radial-gradient(ellipse at 45% 45%,#0a1a08,#040c04)",caption:"The Backroom showcases the modular system in its purest form. Clean materials, uniform lighting, and repetitive architectural elements intentionally expose the underlying structure, reinforcing the **artificial and unsettling atmosphere** of the space."},
             {label:"Pieces",src:gh("environments/subway-modular-kit/modular-kit/backroom-l2/06-pieces-3.png"),bg:"radial-gradient(ellipse at 55% 55%,#081a0a,#040a04)",caption:"The Backroom showcases the modular system in its purest form. Clean materials, uniform lighting, and repetitive architectural elements intentionally expose the underlying structure, reinforcing the **artificial and unsettling atmosphere** of the space."},
           ]},
           {id:"abandoned-l1",label:"Abandoned (L1)",imgs:[
             {label:"Full Modular Kit",src:gh("environments/subway-modular-kit/modular-kit/abandoned-l1/01-fullmodularkit.png"),bg:"radial-gradient(ellipse at 50% 50%,#1a0a08,#0a0504)",caption:"The Abandoned Zone is built from the **exact same modular pieces**, recontextualized through material degradation, lighting, and environmental dressing. This demonstrates the core strength of the system: creating a completely different atmosphere without increasing the structural asset count."},
             {label:"Pieces",src:gh("environments/subway-modular-kit/modular-kit/abandoned-l1/02-pieces.png"),bg:"radial-gradient(ellipse at 45% 55%,#180a08,#0a0504)",caption:"The Abandoned Zone is built from the **exact same modular pieces**, recontextualized through material degradation, lighting, and environmental dressing. This demonstrates the core strength of the system: creating a completely different atmosphere without increasing the structural asset count."},
             {label:"Pieces",src:gh("environments/subway-modular-kit/modular-kit/abandoned-l1/03-pieces.png"),bg:"radial-gradient(ellipse at 55% 45%,#1a0c08,#0c0604)",caption:"The Abandoned Zone is built from the **exact same modular pieces**, recontextualized through material degradation, lighting, and environmental dressing. This demonstrates the core strength of the system: creating a completely different atmosphere without increasing the structural asset count."},
             {label:"Pieces",src:gh("environments/subway-modular-kit/modular-kit/abandoned-l1/04-pieces.png"),bg:"radial-gradient(ellipse at 50% 60%,#180808,#0a0404)",caption:"The Abandoned Zone is built from the **exact same modular pieces**, recontextualized through material degradation, lighting, and environmental dressing. This demonstrates the core strength of the system: creating a completely different atmosphere without increasing the structural asset count."},
           ]},
         ]},
        {id:"results",label:"Results",hex:"#99bbaa",
         dualGallery:{
           left:{label:"Backroom",imgs:[
             {label:"L2 Render",src:gh("environments/subway-modular-kit/results/01_l2render_1.png"),bg:bgEnv},
             {label:"L2 Render",src:gh("environments/subway-modular-kit/results/02-l2render-2.png"),bg:"radial-gradient(ellipse at 45% 55%,#0a1a14,#040a08)"},
             {label:"L2 Render",src:gh("environments/subway-modular-kit/results/03-l2render.png"),bg:"radial-gradient(ellipse at 55% 45%,#081a12,#040c08)"},
           ]},
           right:{label:"Abandoned",imgs:[]},
         },
         text:"The final modular pipeline enabled **two visually distinct environments** to be built from a **single shared geometry set** while keeping production scalable, material count low, and the scene efficient to manage in Unity HDRP.",
        },
      ]},
    {id:"gmtk-kit",label:"GMTK Loop Kit",icon:"🔁",orbitRadius:2.9,orbitSpeed:.008,startAngle:3.8,inclination:-.36,radius:.20,hex:"#bb8880",
      type:"Environment Art",status:"GMTK 2026",devPct:null,
      desc:"Built for GMTK Game Jam 2026 around the theme \"Loop\". The goal was to create a **modular kit** that could generate varied levels quickly without duplicating modeling work. The entire system, from concept to textured assets, was designed and produced in a **single afternoon**.",
      tags:["Blender","Unity","Modular Kit","Game Jam"],
      features:["Full kit built in a single afternoon","One geometry set, many configurations","Pieces designed for combinatorial flexibility","Snap-ready scale consistency across all parts"],
      imgs:[
        {label:"Modular Kit",src:gh("environments/gmtk-kit/01-modularkit.png"),bg:"radial-gradient(ellipse at 55% 40%,#081408,#040a04)",caption:"The complete piece library, designed around a simple constraint: every asset had to justify its existence. Built under game jam conditions, the kit prioritizes **combinatorial flexibility**, allowing a small number of pieces to generate a wide variety of layouts."},
        {label:"Modular Kit",src:gh("environments/gmtk-kit/02-objects.png"),bg:"radial-gradient(ellipse at 45% 55%,#0a1206,#050a04)",caption:"The complete piece library, designed around a simple constraint: every asset had to justify its existence. Built under game jam conditions, the kit prioritizes **combinatorial flexibility**, allowing a small number of pieces to generate a wide variety of layouts."},
        {label:"Assembly",src:gh("environments/gmtk-kit/03-fullmodularkit.png"),bg:"radial-gradient(ellipse at 45% 60%,#0a1408,#050a04)",caption:"An example room assembled from the modular kit, demonstrating how a **small set of pieces** can create varied spaces."},
        {label:"Assembly",src:gh("environments/gmtk-kit/04-result.png"),bg:"radial-gradient(ellipse at 55% 45%,#081206,#040a04)",caption:"An example room assembled from the modular kit, demonstrating how a **small set of pieces** can create varied spaces."},
      ],cta:"View on ArtStation",ctaHref:"https://www.artstation.com/artwork/bgvy9E"},
  ]},
  {id:"games",label:"Games",icon:"🎮",hex:"#5944A6",orbitRadius:22,orbitSpeed:.0022,startAngle:.8,radius:1.8,desc:"Game development projects.",moons:[
    {id:"hollow-end",label:"Hollow End",icon:"🎮",orbitRadius:3.4,orbitSpeed:.009,startAngle:1,inclination:.24,radius:.40,hex:"#aa88cc",
      categories:HE_CATEGORIES,launchDate:TARGET_DATE,type:"Horror Game",status:"Steam · Oct 2026",devPct:68,
      desc:"Hollow End is a first-person horror exploration game set in an abandoned subway station, where the player must find a way out by exploring, solving puzzles, and making the right decisions. Inspired by escape rooms and liminal spaces, the game replaces combat with atmosphere, observation, and environmental storytelling. Originally developed as my Final Degree Project and awarded High Honours, it became an opportunity to focus on the career path I want to pursue: Technical Art.",
      tags:["Unity","C#","HDRP","Blender","Horror","Backrooms","Steam"],
      features:["First-person psychological horror","Unity HDRP","Environmental storytelling","Exploration, Puzzles & Decision Making","Backrooms & Liminal Spaces","PC / Steam · Oct 2026"],
      imgs:[],videoId:null,cta:"Wishlist on Steam"},
  ]},
  {id:"vfx",label:"VFX / Shaders",icon:"✨",hex:"#3C226B",orbitRadius:29,orbitSpeed:.0017,startAngle:2.5,radius:1.08,rings:true,desc:"Real-time VFX and custom shaders.",moons:[
    {id:"magic-barrier",label:"Magic Barrier",icon:"🛡️",orbitRadius:2.9,orbitSpeed:.011,startAngle:.5,inclination:.42,radius:.28,hex:"#9e7292",
      type:"VFX / Shader",status:"",devPct:null,
      desc:"A real-time energy shield built in Unity URP, combining Shader Graph and VFX Graph into a single reusable effect. The project focuses on rendering efficiency, using a single-pass double-sided shader while layering vertex animation, bloom, and particle effects without unnecessary rendering cost.",
      tags:["Unity","URP","VFX Graph","Shader Graph","Blender"],
      features:["Single-pass double-face shader via IsFrontFace","HDR Fresnel rim with post-processing bloom","VFX Graph vertex displacement and aura","Event-driven spawn and auto-despawn in 6s","Zero continuous particle emission"],
      imgs:[],cta:"View on ArtStation",ctaHref:"https://www.artstation.com/artwork/L4qQJk",
      categories:[
        {id:"overview",label:"Overview",caption:"The shield spawns on SendEvent, holds for 6 seconds and auto-despawns. No continuous emission, no second material, no extra pass.",imgs:[{label:"Magic Barrier",src:gh("vfx/magic-barrier/overview/01-magic-barrier.png"),bg:"radial-gradient(ellipse at 50% 40%,#18041a,#0c020c)"}],videoId:"WvI2CbB6ZAU"},
        {id:"showcase",label:"Showcase",caption:"",imgs:[
          {label:"Parameters",src:gh("vfx/magic-barrier/showcase/01-parameters.png"),bg:"radial-gradient(ellipse at 50% 60%,#0c0220,#060110)",caption:"Live parameter tweaks showing the exposed controls: rim intensity, band colour, displacement speed and aura opacity."},
        ],videoId:"VwwDhpI-k-g"},
        {id:"technical",label:"Breakdown",caption:"",imgs:[
          {label:"Mesh",src:gh("vfx/magic-barrier/breakdown/01-mesh.png"),bg:"radial-gradient(ellipse at 50% 40%,#14041a,#0a020c)",caption:"The shield uses a **double-sided transparent mesh** whose silhouette defines the readability of the entire effect. Its topology was designed to support both the Fresnel highlights and the vertex displacement, ensuring that the pulse animation remains smooth and visually consistent from every angle."},
          {label:"UV Layout",src:gh("vfx/magic-barrier/breakdown/02-UV.png"),bg:"radial-gradient(ellipse at 45% 55%,#160418,#0a0210)",caption:"The UVs were **manually adjusted in Photoshop** to control how textures wrap around the sphere. This provided precise placement of the equatorial energy band and ensured that surface details tiled consistently before any shader work was introduced."},
          {label:"Shader Graph",src:gh("vfx/magic-barrier/breakdown/03-Shadegraph.png"),bg:"radial-gradient(ellipse at 55% 45%,#12041a,#08020c)",caption:"A **single-pass shader** handles both sides of the mesh using **IsFrontFace**, eliminating the need for duplicate materials or additional rendering passes. The exterior face generates the Fresnel rim and surface details, while the interior receives its own visual treatment. HDR values drive the rim and energy band into Unity's bloom pipeline, creating the shield's characteristic glow."},
          {label:"VFX Graph",src:gh("vfx/magic-barrier/breakdown/04-vfx-graph.png"),bg:"radial-gradient(ellipse at 50% 50%,#160218,#0c010c)",caption:"VFX Graph drives **two independent effects** within the same asset: vertex displacement for the breathing pulse and a second **Mesh Output** context responsible for the outer aura. The entire system is event-driven, spawning on demand and automatically despawning after six seconds, with no continuous particle simulation."},
        ],videoId:null},
      ]},
    {id:"waterfall",label:"Stylized Waterfall",icon:"💧",orbitRadius:3.8,orbitSpeed:.008,startAngle:3.2,inclination:-.3,radius:.22,hex:"#906080",
      type:"VFX / Shader",status:"",devPct:null,
      desc:"A stylized waterfall built in Unity using Shader Graph, VFX Graph, and Particle Systems. The effect is split into two independent systems with different performance priorities: a shader-driven waterfall body and a lightweight splash system, balancing visual quality, runtime flexibility, and mobile-friendly performance.",
      tags:["Unity","VFX Graph","Shader Graph","Blender","Mobile Optimized"],
      features:["One draw call for main body via Mesh Output","Normals generated in-shader via NormalFromHeight","Two-layer UV scrolling without physics simulation","1000 quad particles with noise-based alpha clip","Runtime UI with sliders and colour picker"],
      imgs:[],cta:"View on ArtStation",ctaHref:"https://www.artstation.com/artwork/2BgoNy",
      categories:[
        {id:"overview",label:"Overview",caption:"Main water body at one draw call. Splash and fog at the base kept deliberately cheap to contain overdraw where particles overlap heavily.",imgs:[{label:"Stylized Waterfall",src:gh("vfx/waterfall/overview/01-stylized-waterfall.png"),bg:"radial-gradient(ellipse at 40% 70%,#041018,#020810)"}],videoId:"S8ndamM_ybg"},
        {id:"showcase",label:"Showcase",caption:"",imgs:[
          {label:"Showcase",src:gh("vfx/waterfall/showcase/01-showcase.png"),bg:"radial-gradient(ellipse at 50% 40%,#041418,#02090e)",caption:"Full waterfall in scene with splash system active. Shows how the two systems read together as one coherent effect."},
          {label:"Parameters",src:gh("vfx/waterfall/showcase/02-parameters.png"),bg:"radial-gradient(ellipse at 50% 60%,#04101a,#020810)",caption:"Live UI with sliders and colour picker. Tiling speed, foam intensity, colour grading and particle density all tweakable in real time."},
        ],videoId:"3nqZCaLPB2M"},
        {id:"technical",label:"Breakdown",caption:"",imgs:[
          {label:"Mesh",src:gh("vfx/waterfall/breakdown/01-mesh.png"),bg:"radial-gradient(ellipse at 55% 40%,#04101a,#020810)",caption:"The waterfall body is built from a **single low-complexity mesh** designed to let the shader carry most of the visual detail. Its topology follows the direction of the water flow, minimizing UV stretching and preserving smooth motion around curves."},
          {label:"Waterfall Shader",src:gh("vfx/waterfall/breakdown/02-waterfall-shader.png"),bg:"radial-gradient(ellipse at 45% 60%,#040e18,#020708)",caption:"The water surface is generated entirely in **Shader Graph** using two texture layers scrolling at different speeds to simulate flow without relying on physics. Surface normals are reconstructed in real time through **NormalFromHeight**, removing the need for baked normal maps. Key parameters such as colour, tiling, foam intensity, and scroll speed are exposed for live tweaking."},
          {label:"Splash Shader",src:gh("vfx/waterfall/breakdown/03-splash-shader.png"),bg:"radial-gradient(ellipse at 50% 50%,#041218,#020a0c)",caption:"A dedicated **Unlit Shader** powers the splash and fog particles. A soft radial texture combined with a **noise-based alpha clip** produces natural dissolving edges without the cost of complex transparency. With no lighting model or normal maps, the shader stays lightweight enough to support hundreds of overlapping particles while remaining suitable for mobile hardware."},
          {label:"Particle System",src:gh("vfx/waterfall/breakdown/04-particle-system.png"),bg:"radial-gradient(ellipse at 55% 55%,#040e16,#020810)",caption:"Splash and fog are handled through a lightweight Particle System composed of **1000 quad particles**, built in **VFX Graph** rather than the legacy Shuriken system for better performance on mobile. Each particle uses the splash shader's noise-based alpha clip for a soft dissolving edge, while the whole system stays intentionally simple to limit overdraw in areas with heavy particle overlap."},
        ],videoId:null},
      ]},
  ]},
  {id:"tools",label:"Tools",icon:"🔧",hex:"#3E1659",orbitRadius:36,orbitSpeed:.0012,startAngle:4.5,radius:.72,desc:"Custom Unity editor tools.",moons:[
    {id:"scatter-tool",label:"Replacement & Scatter Tool",icon:"🔧",orbitRadius:2.1,orbitSpeed:.012,startAngle:2,inclination:-.28,radius:.26,hex:"#9099e2",
      type:"Unity Tool",status:"",devPct:null,
      desc:"A Unity Editor extension that automates scene population workflows. It operates in two modes: Replace, which swaps selected objects with weighted-random prefabs, and Scatter, which distributes instances around existing objects without modifying them.",
      tags:["Unity","C#","Editor Tools","Procedural","ScriptableObject"],
      features:["Two modes: weighted Replace and procedural Scatter","Weighted prefab system with cumulative probability","Tag and name filtering for target selection","Surface alignment via downward raycasting","Configurable transform and scale randomization","Seeded determinism with isolated random state","Non-destructive preview with ghost instances","ScriptableObject-based preset system","Full Unity Undo integration"],
      imgs:[
        {label:"Hook Video",src:null,bg:"radial-gradient(ellipse at 50% 40%,#0a0e1a,#050810)",videoId:"sqHVsmYYLsU",caption:"Quick look at the tool in action."},
        {label:"Full Demo",src:null,bg:"radial-gradient(ellipse at 50% 40%,#080c18,#040610)",videoId:"TYoK6CLA0mY",caption:"Full walkthrough of all tool features and workflow."},
      ],cta:"View on GitHub",
      categories:[
        {id:"core-systems",label:"Core Systems",hex:"#7080e0",
         imgs:[{label:"Tool Overview",src:null,bg:"radial-gradient(ellipse at 50% 40%,#0a0e1a,#050810)",videoId:"Dl6SS5CLTXE",caption:"The Object Replacement Tool is a Unity Editor extension designed to automate scene population workflows. It operates in two modes: Replace, which swaps selected objects with weighted-random prefabs, and Scatter, which distributes instances around existing objects without modifying them. Both modes share a unified system for transforms, randomization, surface alignment, undo support, and previewing."}],
         text:"The core architecture splits the tool into two distinct modes - Replace and Scatter - built on a shared pipeline for transforms, randomization, surface alignment, undo support, and previewing.",
         subcategories:[
           {id:"prefab-system",label:"Prefab System",videoId:"E6_3iGuphXo",imgs:[{label:"Weighted Selection",src:null,bg:"radial-gradient(ellipse at 45% 55%,#080c18,#040610)",caption:"The tool uses a weighted prefab system where each entry defines a spawn probability through a configurable weight value. Prefabs are selected at runtime using a cumulative weight algorithm, ensuring statistically correct distribution across large batches. Invalid or zero-weight entries are ignored, and execution is blocked if no valid prefabs are available."}]},
           {id:"targeting",label:"Targeting System",videoId:"CZhshdW902s",imgs:[{label:"Targeting",src:null,bg:"radial-gradient(ellipse at 55% 45%,#0c1020,#060810)",caption:"Objects can be selected as targets directly from the current selection, or automatically gathered by tag or name filtering. All targets are cached and processed in a stable, deterministic order to ensure consistent results across runs when using seeded randomness. In Scatter mode, targeting is limited to the current selection to preserve explicit control over spawn sources."}]},
           {id:"modes",label:"Modes",imgs:[{label:"Replace vs Scatter",src:null,bg:"radial-gradient(ellipse at 50% 50%,#0a0e1a,#050810)",caption:"Replace mode destroys each target object and replaces it with a randomly selected prefab. Scatter mode preserves the original objects and instead spawns multiple instances around them within a defined radius. Both modes reuse the same core pipeline for transform application, alignment, and randomization, ensuring consistent behavior across workflows."}]},
           {id:"scatter-system",label:"Scatter System",videoId:"P5dfYw8AfGY",imgs:[{label:"Scatter Generation",src:null,bg:"radial-gradient(ellipse at 45% 55%,#080c18,#040610)",caption:"Scatter generation distributes instances using a circular random sampling approach around each source object. A configurable overlap system prevents excessive clustering by enforcing minimum distance checks between spawned instances. Each position is validated against previously placed objects to maintain spatial coherence across the full scatter operation."}]},
         ]},
        {id:"transform-placement",label:"Transform & Placement",hex:"#4a5ac0",
         text:"Every generated instance can be precisely controlled through configurable position, rotation, and scale offsets. Surface alignment uses raycasting to conform placements to scene geometry. All transform values are evaluated and applied as part of the generation pipeline, not as a post-process step.",
         subcategories:[
           {id:"surface-alignment",label:"Surface Alignment",videoId:"kjIh2VnRw_8",imgs:[{label:"Surface Alignment",src:null,bg:"radial-gradient(ellipse at 50% 40%,#080c18,#040610)",caption:"Objects can be aligned to scene geometry using a downward raycast that resolves the surface hit point and normal. Placement is then offset along the surface normal using a configurable sink depth value. This ensures objects conform to terrain variation while maintaining controllable embedding into the surface."}]},
           {id:"transforms",label:"Transforms",videoId:"Lw6rQs-Fbxk",imgs:[{label:"Transform Offsets",src:null,bg:"radial-gradient(ellipse at 45% 55%,#0a0c1a,#050810)",caption:"The tool applies position, rotation, and scale offsets at placement time to give precise control over how each object is instantiated, while keeping the workflow fully procedural and non-destructive. Transform values are evaluated during instantiation and applied directly to each generated object, making transforms part of the generation pipeline instead of a post-process step."}]},
           {id:"randomization",label:"Randomization",videoId:"JnlV9V_2n5o",imgs:[{label:"Per-Instance Randomization",src:null,bg:"radial-gradient(ellipse at 55% 45%,#080c18,#040610)",caption:"Each instance supports independent variation in position, rotation, and scale to avoid visual repetition. Random values are sampled from configurable min-max ranges at execution time. Scale can operate in either uniform mode or per-axis mode, with both options mutually exclusive to prevent conflicting transformations."}]},
         ]},
        {id:"workflow",label:"Workflow",hex:"#8090e8",
         text:"The tool is designed for safe, iterative authoring. Seeded determinism guarantees reproducible results, the preview system shows ghost instances before committing, presets store full configurations as ScriptableObjects, and all operations integrate with Unity's Undo system.",
         subcategories:[
           {id:"seeded-determinism",label:"Seeded Determinism",imgs:[{label:"Seeded Determinism",src:null,bg:"radial-gradient(ellipse at 50% 40%,#0a0c1a,#050810)",caption:"All random operations can be driven by a fixed seed, ensuring fully reproducible results across executions. The tool isolates its random state during execution and restores it afterward, preventing interference with other systems in the Unity session. This allows deterministic scene generation without affecting global randomness."}]},
           {id:"preview",label:"Preview System",videoId:"wuc3opLIMfw",imgs:[{label:"Preview System",src:null,bg:"radial-gradient(ellipse at 45% 55%,#080c18,#040610)",caption:"The preview system generates ghost instances of the final result without modifying the scene. Preview objects use temporary materials and are fully isolated from the undo stack. Changes in selection, seed, or configuration automatically trigger regeneration, providing a live representation of the final output."}]},
           {id:"presets-parenting",label:"Presets & Parenting",videoId:"4T8QWvAsooE",imgs:[{label:"Presets & Parenting",src:null,bg:"radial-gradient(ellipse at 55% 45%,#0a0e1a,#050810)",caption:"The generated scenes can be organized and reused by grouping all spawned objects under a single parent and allowing full tool configurations to be saved as presets. All generated instances are automatically parented under a dedicated group object, while the full tool state is stored in ScriptableObject-based presets that can be saved and reloaded across scenes."}]},
           {id:"undo",label:"Undo & Safety",imgs:[{label:"Undo Safety",src:null,bg:"radial-gradient(ellipse at 50% 50%,#080c18,#040610)",caption:"All operations are fully integrated with Unity's Undo system, grouping complex multi-object operations into a single step. This ensures safe iteration during scene authoring, allowing users to revert large replacements or scatter operations without manual cleanup."}]},
           {id:"error-control",label:"Error Control",imgs:[{label:"Workflow & User Error Control",src:gh("tools/scatter-tool/workflow/error-control/01-workflow-user-error.png"),bg:"radial-gradient(ellipse at 50% 50%,#0a0c1a,#050810)",caption:"To ensure safe and predictable behavior, all inputs are validated before execution to prevent invalid operations, blocking the process if any value could lead to an undefined state. This ensures objects are never spawned in unstable or incorrect configurations.\n\nThe tool also provides full undo support by grouping all generated changes into a single Ctrl+Z action. Long operations are visually tracked with a progress indicator, and contextual warnings help identify risky setups before committing."}]},
         ]},
        {id:"ui-architecture",label:"UI Architecture",hex:"#6070d8",
         imgs:[{label:"UI Architecture",src:null,bg:"radial-gradient(ellipse at 50% 40%,#0a0e1a,#050810)"}],
         text:"The tool is implemented as a single Unity EditorWindow with modular UI sections. Each feature is exposed through collapsible panels, separating target configuration, prefab management, transform controls, and execution logic. The interface prioritizes clarity and fast iteration over deep nesting or complex menus.",
        },
      ]},
  ]},
  {id:"ai",label:"AI Projects",icon:"🤖",hex:"#1BC2E3",orbitRadius:54,orbitSpeed:.00065,startAngle:5.8,radius:.58,orbitTilt:.38,desc:"AI tools and micro-SaaS - coming soon.",moons:[]},
  {id:"web",label:"Web Dev",icon:"🌐",hex:"#3CC87A",orbitRadius:66,orbitSpeed:.00038,startAngle:2.4,radius:.52,orbitTilt:.64,desc:"Client websites deployed for clubs, stores and hospitality.",moons:[
    {id:"btt-valls",label:"btt-valls.com",icon:"🚵",orbitRadius:2.0,orbitSpeed:.013,startAngle:.8,inclination:.32,radius:.22,hex:"#70d4a0",
      type:"Website",status:"Live",devPct:null,
      desc:"Club website for Club Ciclista BTT Valls. Custom WordPress build covering routes, news, events and member information for the mountain bike community of Valls.",
      tags:["WordPress","Web Design","CSS","PHP"],
      features:["Route and event listings","Member area","News and media section","Mobile-first design","Custom theme"],
      imgs:[{label:"btt-valls.com",src:null,bg:"radial-gradient(ellipse at 50% 40%,#041a0c,#020e06)",caption:"Club website for Club Ciclista BTT Valls, covering routes, news, events and member information for the local mountain bike community. Live and in use by the club, covering the full range of content needs from route publishing to event announcements."}],cta:"Visit Website",ctaHref:"https://btt-valls.com"},
    {id:"edujuguetes",label:"edujuguetes.com",icon:"🧸",orbitRadius:2.8,orbitSpeed:.010,startAngle:2.6,inclination:-.2,radius:.22,hex:"#58cc8c",
      type:"Website",status:"Live",devPct:null,
      desc:"E-commerce site for an educational toy store. Product catalog, cart integration and order management for a specialty retail shop.",
      tags:["WordPress","WooCommerce","Web Design","CSS"],
      features:["Full WooCommerce product catalog","Cart and checkout integration","Category and filter system","Mobile-first design","Custom theme"],
      imgs:[{label:"edujuguetes.com",src:null,bg:"radial-gradient(ellipse at 50% 40%,#061808,#030e04)",caption:"E-commerce site for an educational toy store. Product catalog, shopping cart integration and order management built on WooCommerce. Live store with full product catalog and checkout flow operational."}],cta:"Visit Website",ctaHref:"https://edujuguetes.com"},
    {id:"tirambarcosta",label:"tirambarcostadaurada.com",icon:"🍹",orbitRadius:3.6,orbitSpeed:.008,startAngle:4.2,inclination:.13,radius:.22,hex:"#84e0b4",
      type:"Website",status:"Live",devPct:null,
      desc:"Landing page for a bar-restaurant on the Costa Daurada. Menu showcase, location and contact information for a hospitality client.",
      tags:["WordPress","Web Design","CSS","Hospitality"],
      features:["Menu and food showcase","Location and contact section","Image gallery","Reservation info","Mobile-first design"],
      imgs:[{label:"tirambarcostadaurada.com",src:null,bg:"radial-gradient(ellipse at 50% 40%,#041610,#020c08)",caption:"Landing page for a bar-restaurant on the Costa Daurada. Menu showcase, gallery, contact information and location for a hospitality client. Live and in use by the client, serving as the main digital presence for the restaurant."}],cta:"Visit Website",ctaHref:"https://tirambarcostadaurada.com"},
  ]},
];

const ALL_ITEMS=[{id:"star",type:"star",label:"Jordi",icon:"⭐",hex:STAR.hex},...PLANETS.map(p=>({id:p.id,type:"planet",label:p.label,icon:p.icon,hex:p.hex})),...PLANETS.flatMap(p=>p.moons.map(m=>({id:m.id,type:"moon",label:m.label,icon:m.icon,hex:m.hex,planetId:p.id})))];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes progFill{from{width:0}to{}}
@keyframes modalIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes warpIn{0%{opacity:0;transform:scale(.4)}35%{opacity:1}100%{opacity:0;transform:scale(3)}}
@keyframes tipIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@keyframes cdPulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes captionFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes introUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes introIn{from{opacity:0}to{opacity:1}}
@keyframes introBlink{0%,100%{opacity:.14}50%{opacity:.44}}
.pf-btn:hover{filter:brightness(1.25)!important}
.pf-nav:hover{background:rgba(0,0,0,.85)!important}
.pf-tab:hover{border-color:rgba(255,255,255,.28)!important}
`;

const renderBold=t=>t?t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p,i)=>{if(p.startsWith('**')&&p.endsWith('**'))return(<strong key={i} style={{color:"rgba(232,232,240,.98)",fontWeight:600}}>{p.slice(2,-2)}</strong>);if(p.startsWith('*')&&p.endsWith('*'))return(<em key={i} style={{fontStyle:"italic",color:"rgba(232,232,240,.82)"}}>{p.slice(1,-1)}</em>);return p;}):null;
const HowItWorks=({text,c})=>{const[open,setOpen]=useState(false);if(!text)return null;return(<div style={{marginTop:".55rem"}}>
  <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:".35rem",padding:".28rem .6rem",fontSize:".62rem",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".08em",color:c,background:`${c}14`,border:`1px solid ${c}44`,borderRadius:"6px",cursor:"pointer",transition:"all .2s"}}>
    <span style={{display:"inline-block",transition:"transform .2s",transform:open?"rotate(90deg)":"none"}}>▸</span> HOW IT WORKS
  </button>
  {open&&<p style={{fontSize:".79rem",lineHeight:1.66,color:"rgba(232,232,240,.68)",whiteSpace:"pre-line",marginTop:".5rem",padding:".7rem .8rem",background:`${c}0a`,border:`1px solid ${c}22`,borderRadius:"8px",animation:"captionFade .18s ease"}}>{renderBold(text)}</p>}
</div>);};

function Countdown({targetDate,c}){
  const[rem,setRem]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{const upd=()=>{const diff=new Date(targetDate)-new Date();if(diff<=0)return;setRem({d:Math.floor(diff/86400000),h:Math.floor(diff%86400000/3600000),m:Math.floor(diff%3600000/60000),s:Math.floor(diff%60000/1000)});};upd();const iv=setInterval(upd,1000);return()=>clearInterval(iv);},[targetDate]);
  return(<div style={{display:"flex",alignItems:"center",gap:".6rem",padding:".6rem .9rem",background:`${c}18`,border:`1px solid ${c}40`,borderRadius:"10px",marginBottom:".9rem"}}>
    <span style={{fontSize:".6rem",color:`${c}cc`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".12em",flexShrink:0}}>LAUNCH IN</span>
    <div style={{display:"flex",gap:".4rem"}}>{Object.entries(rem).map(([k,v])=>(<div key={k} style={{textAlign:"center",minWidth:"2.2rem"}}><div style={{fontSize:"1.05rem",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:c,animation:"cdPulse 2s infinite"}}>{String(v).padStart(2,"0")}</div><div style={{fontSize:".5rem",color:`${c}88`,letterSpacing:".1em"}}>{k.toUpperCase()}</div></div>))}</div>
  </div>);
}

function MoonTooltip({moon,x,y}){
  if(!moon)return null;
  return(<div style={{position:"fixed",left:x+18,top:y-58,background:"rgba(7,7,17,.94)",backdropFilter:"blur(16px)",border:`1px solid ${moon.hex}44`,borderRadius:"10px",padding:".55rem .8rem",pointerEvents:"none",zIndex:150,fontFamily:"'Space Grotesk',sans-serif",minWidth:160,animation:"tipIn .15s ease"}}>
    <div style={{fontSize:".78rem",fontWeight:600,color:"#e8e8f0",marginBottom:".18rem"}}>{moon.icon} {moon.label}</div>
    <div style={{fontSize:".62rem",color:moon.hex,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".06em"}}>{moon.type}{moon.status?` · ${moon.status}`:""}</div>
  </div>);
}

function StatusBar(){
  const projects=PLANETS.flatMap(p=>p.moons).length;
  const cats=PLANETS.filter(p=>p.moons.length>0).length;
  const div=<span style={{width:1,height:10,background:"rgba(255,255,255,.1)",display:"inline-block"}}/>;
  return(<div style={{position:"fixed",bottom:"1.5rem",left:"50%",transform:"translateX(-50%)",background:"rgba(7,7,17,.72)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"8px",padding:".3rem 1rem",display:"flex",gap:"1rem",alignItems:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:".57rem",color:"rgba(232,232,240,.35)",letterSpacing:".1em",zIndex:50,pointerEvents:"none",userSelect:"none"}}>
    <span>🎮 {cats} categories</span>{div}<span>✦ {projects} projects</span>{div}<span>📍 Barcelona</span>{div}<span>⏱ 4+ yrs</span>
  </div>);
}

function Gallery({imgs,videoId,c,idx,onIdx,maxH}){
  if(!imgs?.length)return null;
  const[failed,setFailed]=useState(()=>new Set());
  const cur=imgs[idx]||imgs[0];
  const activeVid=cur.videoId??videoId;
  const showImg=cur.src&&!failed.has(cur.src);
  const nb=(dir,fn)=>(<button className="pf-nav" onClick={fn} style={{position:"absolute",[dir]:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.6)",border:`1px solid ${c}44`,color:c,width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s",zIndex:2}}>{dir==="left"?"‹":"›"}</button>);
  return(<div style={{marginBottom:".75rem"}}>
    <div style={{position:"relative",width:"100%",borderRadius:"10px",overflow:"hidden",aspectRatio:"16/9",maxHeight:maxH,border:`1px solid ${c}28`}}>
      {activeVid?<iframe src={`https://www.youtube.com/embed/${activeVid}?autoplay=1&mute=1`} title={cur.label||"video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{width:"100%",height:"100%",border:"none",display:"block"}}/>
        :showImg?<img src={cur.src} alt={cur.label||""} onError={()=>setFailed(s=>new Set(s).add(cur.src))} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        :<div style={{width:"100%",height:"100%",background:cur.bg||"rgba(255,255,255,.02)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle,${c}07 1px,transparent 1px)`,backgroundSize:"22px 22px"}}/>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,.55) 100%)"}}/>
          {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h])=>(<div key={v+h} style={{position:"absolute",[v]:8,[h]:8,width:14,height:14,borderTop:v==="top"?`1.5px solid ${c}55`:"none",borderBottom:v==="bottom"?`1.5px solid ${c}55`:"none",borderLeft:h==="left"?`1.5px solid ${c}55`:"none",borderRight:h==="right"?`1.5px solid ${c}55`:"none"}}/>))}
          <div style={{position:"absolute",bottom:7,left:10,fontSize:".58rem",color:`${c}88`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".12em"}}>{(cur.label||"PLACEHOLDER").toUpperCase()}</div>
        </div>}
      {!activeVid&&imgs.length>1&&<>{nb("left",()=>onIdx(i=>(i-1+imgs.length)%imgs.length))}{nb("right",()=>onIdx(i=>(i+1)%imgs.length))}</>}
      {!activeVid&&imgs.length>1&&(<div style={{position:"absolute",bottom:8,right:10,display:"flex",gap:4,zIndex:2}}>{imgs.map((_,i)=><div key={i} onClick={()=>onIdx(i)} style={{width:i===idx?14:5,height:5,borderRadius:"100px",background:i===idx?c:`${c}44`,cursor:"pointer",transition:"all .2s"}}/>)}</div>)}
    </div>
  </div>);
}

function Modal({c,onClose,children,width}){
  return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,8,.72)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"clamp(1rem,3vw,2rem)"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:width||"min(1400px,94vw)",maxHeight:"88vh",background:"rgba(7,7,17,.97)",backdropFilter:"blur(28px)",border:`1px solid ${c}30`,borderRadius:"20px",boxShadow:`0 0 80px ${c}18,0 30px 80px rgba(0,0,0,.7)`,overflowY:"auto",scrollbarWidth:"none",fontFamily:"'Space Grotesk',sans-serif",color:"#e8e8f0",animation:"modalIn .35s cubic-bezier(.16,1,.3,1)"}}>{children}</div>
  </div>);
}

function StarPanel({onClose}){
  const[tab,setTab]=useState("about");const[msg,setMsg]=useState({n:"",e:"",t:""});
  const[bioX,setBioX]=useState(false);
  const c=STAR.hex;
  const inp=(ex={})=>({display:"block",width:"100%",padding:".55rem .7rem",marginBottom:".45rem",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"8px",color:"#e8e8f0",fontSize:".83rem",outline:"none",fontFamily:"'Space Grotesk',sans-serif",...ex});
  const L=({t})=><div style={{fontSize:".6rem",color:c,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".22em",marginBottom:".5rem"}}>{t}</div>;
  return(<Modal c={c} onClose={onClose}>
    <div style={{padding:"1.75rem 1.75rem 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:`${c}22`,border:`2px solid ${c}66`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"1.2rem",color:c,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>JA</div>
          <div><div style={{fontWeight:700,fontSize:"1.2rem",letterSpacing:".05em"}}>Jordi Altisèn</div><div style={{fontSize:".72rem",color:`${c}99`,marginTop:".1rem"}}>Barcelona · Game Dev · Technical Artist</div></div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.14)",color:"#e8e8f0",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
      </div>
      <div style={{display:"flex",gap:".4rem",marginBottom:"1rem"}}>{["about","contact"].map(t=><button key={t} className="pf-tab" onClick={()=>setTab(t)} style={{padding:".32rem .8rem",background:tab===t?`${c}22`:"transparent",border:`1px solid ${tab===t?c+"66":"rgba(255,255,255,.1)"}`,borderRadius:"6px",color:tab===t?c:"rgba(232,232,240,.4)",cursor:"pointer",fontSize:".72rem",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".1em",transition:"all .2s"}}>{t.toUpperCase()}</button>)}</div>
      <div style={{height:1,background:`linear-gradient(90deg,${c}55,transparent)`,marginBottom:"1.25rem"}}/>
    </div>
    {tab==="about"&&(<div style={{padding:"0 1.75rem 1.75rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem"}}>
      <div>
        <L t="BIO"/>
        <p style={{fontSize:".87rem",lineHeight:1.72,color:"rgba(232,232,240,.75)",whiteSpace:"pre-line",marginBottom:".5rem"}}>{bioX?STAR.bioExtended:STAR.bio}</p>
        <button onClick={()=>setBioX(b=>!b)} style={{background:"none",border:"none",color:`${c}66`,fontSize:".68rem",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".1em",cursor:"pointer",marginBottom:"1.25rem",padding:0,display:"block"}}>{bioX?"↑ Read less":"↓ Read more"}</button>
        <L t="TIMELINE"/>
        {STAR.timeline.map((it,i)=>(<div key={i} style={{display:"flex",gap:".65rem",position:"relative",paddingBottom:i<STAR.timeline.length-1?".75rem":"0"}}>{i<STAR.timeline.length-1&&<div style={{position:"absolute",left:"2.2rem",top:"1.3rem",width:1,bottom:0,background:`${c}22`}}/>}<span style={{fontSize:".62rem",color:c,fontFamily:"'JetBrains Mono',monospace",minWidth:"2.5rem",paddingTop:".2rem",fontWeight:700}}>{it.y}</span><div><div style={{fontSize:".82rem",fontWeight:600,color:"rgba(232,232,240,.9)"}}>{it.l}</div><div style={{fontSize:".72rem",color:"rgba(232,232,240,.42)",marginTop:".08rem"}}>{it.d}</div></div></div>))}
      </div>
      <div>
        <L t="SKILLS"/>
        <div style={{marginBottom:"1.25rem"}}>{STAR.skills.map(({s,p})=>(<div key={s} style={{marginBottom:".45rem"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:".77rem",color:"rgba(232,232,240,.8)"}}>{s}</span><span style={{fontSize:".62rem",color:`${c}99`,fontFamily:"'JetBrains Mono',monospace"}}>{p}%</span></div><div style={{height:2.5,background:"rgba(255,255,255,.06)",borderRadius:2}}><div style={{height:"100%",width:`${p}%`,background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:2,animation:"progFill .9s ease"}}/></div></div>))}</div>
        <L t="LANGUAGES"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".35rem",marginBottom:"1.5rem"}}>{STAR.langs.map(({l,lv})=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:".28rem .5rem",background:"rgba(255,255,255,.025)",borderRadius:"6px"}}><span style={{fontSize:".8rem",color:"rgba(232,232,240,.75)"}}>{l}</span><span style={{fontSize:".68rem",color:c,fontFamily:"'JetBrains Mono',monospace"}}>{lv}</span></div>))}</div>
        <a href="#" className="pf-btn" onClick={e=>e.preventDefault()} style={{display:"block",textAlign:"center",padding:".72rem",background:`${c}22`,border:`1px solid ${c}66`,borderRadius:"10px",color:c,textDecoration:"none",fontSize:".87rem",fontWeight:600,transition:"filter .2s"}}>Download CV</a>
      </div>
    </div>)}
    {tab==="contact"&&(<div style={{padding:"0 1.75rem 1.75rem",maxWidth:520,margin:"0 auto"}}><input style={inp()} placeholder="Your name" value={msg.n} onChange={e=>setMsg(m=>({...m,n:e.target.value}))}/><input style={inp()} placeholder="your@email.com" value={msg.e} onChange={e=>setMsg(m=>({...m,e:e.target.value}))}/><textarea style={inp({resize:"vertical",marginBottom:"1rem"})} rows={5} placeholder="Your message" value={msg.t} onChange={e=>setMsg(m=>({...m,t:e.target.value}))}/><button className="pf-btn" onClick={()=>alert("Sent!")} style={{width:"100%",padding:".72rem",background:`${c}22`,border:`1px solid ${c}66`,borderRadius:"10px",color:c,cursor:"pointer",fontSize:".87rem",fontWeight:600,marginBottom:"1.25rem",transition:"filter .2s"}}>Send Message</button><div style={{display:"flex",gap:".5rem",justifyContent:"center"}}>{["GitHub","LinkedIn","Itch.io"].map(l=><a key={l} href="#" onClick={e=>e.preventDefault()} style={{padding:".38rem .9rem",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.11)",borderRadius:"8px",color:"rgba(232,232,240,.6)",textDecoration:"none",fontSize:".78rem",fontFamily:"'JetBrains Mono',monospace"}}>{l}</a>)}</div></div>)}
  </Modal>);
}

function ProjectPanel({project,onClose}){
  const hasCats=!!(project.categories?.length);
  const hasSubcats=hasCats&&project.categories.some(c=>c.subcategories?.length>0);
  const[catId,setCatId]=useState(null);
  const[subcatId,setSubcatId]=useState(null);
  const[imgIdx,setImgIdx]=useState(0);
  const[imgIdx2,setImgIdx2]=useState(0);
  useEffect(()=>{setImgIdx(0);setSubcatId(null);},[catId]);
  useEffect(()=>{setImgIdx(0);},[subcatId]);
  const pC=project.hex;
  const T=({t})=><span style={{padding:".18rem .6rem",background:`${pC}18`,border:`1px solid ${pC}44`,borderRadius:"100px",fontSize:".68rem",color:pC,fontFamily:"'JetBrains Mono',monospace"}}>{t}</span>;
  const Lb=({t,c=pC})=><div style={{fontSize:".6rem",color:c,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".22em",marginBottom:".45rem"}}>{t}</div>;
  const CloseBtn=()=><button onClick={onClose} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.14)",color:"#e8e8f0",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>x</button>;
  const EmptySlot=({c})=><div style={{aspectRatio:"16/9",background:"rgba(255,255,255,.02)",border:`1px dashed ${c}22`,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:".75rem"}}><span style={{fontSize:".72rem",color:`${c}44`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".1em"}}>Coming soon</span></div>;
  const RightMeta=({c=pC})=>{
    return(<div style={{marginBottom:"1.1rem"}}><Lb t="FEATURES" c={c}/>{project.features.map((f,i)=><div key={i} style={{display:"flex",gap:".45rem",fontSize:".82rem",color:"rgba(232,232,240,.72)",marginBottom:".3rem"}}><span style={{color:pC,flexShrink:0,fontSize:".65rem",marginTop:".1rem"}}>▸</span>{f}</div>)}</div>);
  };
  const TagsRow=()=><div style={{display:"flex",flexWrap:"wrap",gap:".38rem"}}>{project.tags.map(t=><T key={t} t={t}/>)}</div>;
  const WishlistBtn=({c=pC})=>{
    const href=project.ctaHref||"#";const isExt=href.startsWith("http");
    const lp=isExt?{href,target:"_blank",rel:"noopener noreferrer"}:{href:"#",onClick:e=>e.preventDefault()};
    return(<a {...lp} className="pf-btn" style={{display:"block",textAlign:"center",padding:".85rem",background:`${c}22`,border:`1px solid ${c}66`,borderRadius:"10px",color:c,textDecoration:"none",fontSize:".9rem",fontWeight:600,transition:"filter .2s"}}>{project.cta}</a>);
  };
  const typeLabel=[project.type,project.status].filter(s=>s&&s.trim()).map(s=>s.toUpperCase()).join(" · ");
  const linkBtn=(l,c)=>{const ext=(l.href||"#").startsWith("http");const lp=ext?{href:l.href,target:"_blank",rel:"noopener noreferrer"}:{href:"#",onClick:e=>e.preventDefault()};return(<a key={l.label} {...lp} className="pf-btn" style={{display:"flex",alignItems:"center",gap:".6rem",padding:".7rem",background:`${c}22`,border:`1px solid ${c}66`,borderRadius:"10px",color:c,textDecoration:"none",fontWeight:600,marginTop:".6rem",fontSize:".88rem",transition:"filter .2s"}}><span>{l.icon}</span>{l.label}</a>);};

  if(hasSubcats){
    const activeCat=project.categories.find(c=>c.id===catId);
    const activeSubcat=activeCat?.subcategories?.find(s=>s.id===subcatId);
    const c=activeCat?.hex||pC;
    const ovImgs=(project.imgs?.length?project.imgs:null)||project.categories[0]?.subcategories?.[0]?.imgs||project.categories[0]?.imgs||[];
    const previewImgs=activeCat?(activeCat.imgs?.length?activeCat.imgs:(activeCat.subcategories?.[0]?.imgs||[])):[];
    const imgs=activeCat?(activeCat.isOverview?(activeCat.imgs||[]):(activeSubcat?.imgs||[])):[];
    const vid=activeSubcat?.videoId??activeCat?.videoId??project.videoId;
    const caption=imgs[imgIdx]?.caption||activeSubcat?.caption;
    return(<Modal c={pC} onClose={onClose} width={activeSubcat?"min(980px,94vw)":"min(1400px,94vw)"}>
      <div style={{padding:"1.75rem 1.75rem 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".75rem"}}><div><div style={{fontSize:".62rem",color:c,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".22em",marginBottom:".25rem"}}>{typeLabel}</div><h2 style={{fontSize:"1.5rem",fontWeight:600,display:"flex",gap:".5rem",alignItems:"center"}}>{project.icon} {project.label}</h2></div><CloseBtn/></div>
        <div style={{display:"flex",gap:".28rem",flexWrap:"wrap",margin:".65rem 0 .85rem"}}>
          <button onClick={()=>setCatId(null)} style={{padding:".22rem .58rem",fontSize:".66rem",fontFamily:"'JetBrains Mono',monospace",background:catId===null?`${pC}22`:"transparent",border:`1px solid ${catId===null?pC+"66":"rgba(255,255,255,.07)"}`,borderRadius:"100px",color:catId===null?pC:"rgba(232,232,240,.35)",cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",letterSpacing:".06em",textTransform:"uppercase"}}>Overview</button>
          {project.categories.map(cat=>(<button key={cat.id} onClick={()=>setCatId(cat.id)} style={{padding:".22rem .58rem",fontSize:".66rem",fontFamily:"'JetBrains Mono',monospace",background:catId===cat.id?`${cat.hex||pC}22`:"transparent",border:`1px solid ${catId===cat.id?(cat.hex||pC)+"66":"rgba(255,255,255,.07)"}`,borderRadius:"100px",color:catId===cat.id?(cat.hex||pC):"rgba(232,232,240,.35)",cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",letterSpacing:".06em",textTransform:"uppercase"}}>{cat.icon||""} {cat.label}</button>))}
        </div>
        <div style={{height:1,background:`linear-gradient(90deg,${c}55,transparent)`,marginBottom:"1.25rem"}}/>
      </div>
      {catId===null?(
        <div style={{padding:"0 1.75rem 1.75rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"55fr 45fr",gap:"2rem",marginBottom:"1.3rem"}}>
            <div>
              {ovImgs.length>0?<Gallery imgs={ovImgs} videoId={project.videoId} c={pC} idx={imgIdx} onIdx={setImgIdx}/>:<EmptySlot c={pC}/>}
              {project.devPct!=null&&(<div style={{marginTop:".85rem"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontSize:".6rem",color:pC,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".18em"}}>DEV PROGRESS</span><span style={{fontSize:".6rem",color:pC,fontFamily:"'JetBrains Mono',monospace"}}>{project.devPct}%</span></div><div style={{height:3,background:"rgba(255,255,255,.06)",borderRadius:2}}><div style={{height:"100%",width:`${project.devPct}%`,background:`linear-gradient(90deg,${pC}66,${pC})`,borderRadius:2,animation:"progFill 1s ease"}}/></div></div>)}
              <div style={{marginTop:"1rem"}}><TagsRow/></div>
            </div>
            <div>
              <div style={{marginBottom:"1.1rem"}}><Lb t="ABOUT THIS PROJECT"/><p style={{fontSize:".82rem",lineHeight:1.72,color:"rgba(232,232,240,.65)",textAlign:"justify"}}>{renderBold(project.desc)}</p></div>
              <RightMeta c={pC}/>
              {project.launchDate&&<div style={{marginTop:"1.1rem"}}><Countdown targetDate={project.launchDate} c={pC}/></div>}
            </div>
          </div>
          <WishlistBtn c={pC}/>
        </div>
      ):activeCat.dualGallery?(
        <div style={{padding:"0 1.75rem 1.75rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.2rem"}}>
            <div>
              <Lb t={activeCat.dualGallery.left.label.toUpperCase()} c={c}/>
              {activeCat.dualGallery.left.imgs?.length>0?<Gallery imgs={activeCat.dualGallery.left.imgs} c={c} idx={imgIdx} onIdx={setImgIdx}/>:<EmptySlot c={c}/>}
            </div>
            <div>
              <Lb t={activeCat.dualGallery.right.label.toUpperCase()} c={c}/>
              {activeCat.dualGallery.right.imgs?.length>0?<Gallery imgs={activeCat.dualGallery.right.imgs} c={c} idx={imgIdx2} onIdx={setImgIdx2}/>:<EmptySlot c={c}/>}
            </div>
          </div>
          <div>
            <Lb t={activeCat.label.toUpperCase()} c={c}/>
            <p style={{fontSize:".84rem",lineHeight:1.75,color:"rgba(232,232,240,.72)",whiteSpace:"pre-line",textAlign:"left"}}>{renderBold(activeCat.text)}</p>
          </div>
        </div>
      ):!activeSubcat?(
        <div style={{padding:"0 1.75rem 1.75rem",display:"grid",gridTemplateColumns:"55fr 45fr",gap:"2rem"}}>
          <div>
            {previewImgs.length>0?<Gallery imgs={previewImgs} videoId={vid} c={c} idx={imgIdx} onIdx={setImgIdx}/>:<EmptySlot c={c}/>}
            {activeCat.links?.map(l=>linkBtn(l,c))}
          </div>
          <div>
            {activeCat.isOverview&&activeCat.shortDesc&&(<div style={{padding:".65rem .85rem",background:`${c}08`,border:`1px solid ${c}22`,borderRadius:"8px",marginBottom:"1rem"}}><p style={{fontSize:".8rem",lineHeight:1.7,color:"rgba(232,232,240,.55)",fontStyle:"italic",textAlign:"left"}}>{renderBold(activeCat.shortDesc)}</p></div>)}
            {!activeCat.isOverview&&activeCat.text&&(<div style={{marginBottom:"1rem"}}><Lb t={activeCat.label.toUpperCase()} c={c}/><p style={{fontSize:".84rem",lineHeight:1.75,color:"rgba(232,232,240,.72)",whiteSpace:"pre-line",textAlign:"left"}}>{renderBold(activeCat.text)}</p></div>)}
            {!activeCat.isOverview&&activeCat.subcategories?.length>0&&(<div>
              <Lb t="EXPLORE" c={c}/>
              <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>{activeCat.subcategories.map(sc=>(<button key={sc.id} onClick={()=>{setSubcatId(sc.id);setImgIdx(0);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".7rem .9rem",fontSize:".84rem",fontFamily:"'Space Grotesk',sans-serif",background:`${c}0a`,border:`1px solid ${c}33`,borderRadius:"8px",color:"rgba(232,232,240,.85)",cursor:"pointer",transition:"all .2s",textAlign:"left",textTransform:"uppercase",letterSpacing:".03em"}}>{sc.label}<span style={{color:c,fontSize:".7rem",textTransform:"none"}}>{sc.imgs?.length||0} · →</span></button>))}</div>
            </div>)}
          </div>
        </div>
      ):(
        <div style={{padding:"0 1.75rem 1.75rem"}}>
          {imgs.length>0?<Gallery imgs={imgs} videoId={vid} c={c} idx={imgIdx} onIdx={setImgIdx} maxH="52vh"/>:<EmptySlot c={c}/>}
          {activeCat.subcategories?.length>0&&(<div style={{display:"flex",gap:".28rem",flexWrap:"wrap",margin:".65rem 0 .7rem"}}>{activeCat.subcategories.map(sc=>(<button key={sc.id} className="pf-tab" onClick={()=>{setSubcatId(id=>id===sc.id?null:sc.id);setImgIdx(0);}} style={{padding:".22rem .58rem",fontSize:".64rem",fontFamily:"'JetBrains Mono',monospace",background:subcatId===sc.id?`${c}22`:"transparent",border:`1px solid ${subcatId===sc.id?c+"55":"rgba(255,255,255,.08)"}`,borderRadius:"100px",color:subcatId===sc.id?c:"rgba(232,232,240,.35)",cursor:"pointer",transition:"all .2s",letterSpacing:".06em",whiteSpace:"nowrap",textTransform:"uppercase"}}>{sc.label}</button>))}</div>)}
          {caption&&(<div key={`${catId}-${subcatId}-${imgIdx}`} style={{animation:"captionFade .22s ease",marginTop:".3rem"}}><div style={{fontSize:".6rem",color:`${c}88`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".14em",marginBottom:".3rem"}}>{(imgs[imgIdx]?.label||activeSubcat?.label)?.toUpperCase()}{imgs.length>0?` · ${imgIdx+1}/${imgs.length}`:""}</div><p style={{fontSize:".84rem",lineHeight:1.65,color:"rgba(232,232,240,.75)",whiteSpace:"pre-line",textAlign:"left"}}>{renderBold(caption)}</p><HowItWorks text={imgs[imgIdx]?.details} c={c}/></div>)}
          {activeCat.links?.map(l=>linkBtn(l,c))}
        </div>
      )}
    </Modal>);
  }

  const effCatId=catId??project.categories?.[0]?.id;
  const cat=hasCats?(project.categories.find(c=>c.id===effCatId)||project.categories[0]):null;
  const imgs=cat?.imgs||project.imgs||[];const vid=cat?.videoId??project.videoId;const caption=imgs[imgIdx]?.caption||cat?.caption;
  return(<Modal c={pC} onClose={onClose}>
    <div style={{padding:"1.75rem 1.75rem 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".75rem"}}><div><div style={{fontSize:".62rem",color:pC,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".22em",marginBottom:".25rem"}}>{typeLabel}</div><h2 style={{fontSize:"1.5rem",fontWeight:600,display:"flex",gap:".5rem",alignItems:"center"}}>{project.icon} {project.label}</h2></div><CloseBtn/></div>
      <div style={{height:1,background:`linear-gradient(90deg,${pC}55,transparent)`,marginBottom:"1.25rem"}}/>
    </div>
    <div style={{padding:"0 1.75rem 1.75rem",display:"grid",gridTemplateColumns:"55fr 45fr",gap:"2rem"}}>
      <div>
        {imgs.length>0?<Gallery imgs={imgs} videoId={vid} c={pC} idx={imgIdx} onIdx={setImgIdx}/>:<EmptySlot c={pC}/>}
        {hasCats&&(<><div style={{height:1,background:`linear-gradient(90deg,${pC}33,transparent)`,margin:".4rem 0"}}/><div style={{display:"flex",gap:".28rem",flexWrap:"wrap",margin:".35rem 0 .4rem"}}>{project.categories.map(cat=>(<button key={cat.id} className="pf-tab" onClick={()=>{setCatId(cat.id);setImgIdx(0);}} style={{padding:".22rem .58rem",fontSize:".64rem",fontFamily:"'JetBrains Mono',monospace",background:effCatId===cat.id?`${pC}22`:"transparent",border:`1px solid ${effCatId===cat.id?pC+"55":"rgba(255,255,255,.08)"}`,borderRadius:"100px",color:effCatId===cat.id?pC:"rgba(232,232,240,.35)",cursor:"pointer",transition:"all .2s",letterSpacing:".06em",whiteSpace:"nowrap",textTransform:"uppercase"}}>{cat.label}</button>))}</div><div style={{height:1,background:`linear-gradient(90deg,${pC}22,transparent)`,marginBottom:".55rem"}}/></>)}
        {caption&&(<div key={effCatId} style={{animation:"captionFade .22s ease"}}><div style={{fontSize:".58rem",color:`${pC}88`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".14em",marginBottom:".3rem"}}>{(imgs[imgIdx]?.label||cat?.label)?.toUpperCase()}{imgs.length>0?` · ${imgIdx+1}/${imgs.length}`:""}</div><p style={{fontSize:".81rem",lineHeight:1.72,color:"rgba(232,232,240,.72)",whiteSpace:"pre-line"}}>{renderBold(caption)}</p><HowItWorks text={imgs[imgIdx]?.details} c={pC}/></div>)}
      </div>
      <div><div style={{marginBottom:"1.1rem"}}><Lb t="ABOUT THIS PROJECT"/><p style={{fontSize:".82rem",lineHeight:1.72,color:"rgba(232,232,240,.65)",textAlign:"justify"}}>{renderBold(project.desc)}</p></div><RightMeta/><div style={{marginBottom:"1.3rem"}}><TagsRow/></div><WishlistBtn/></div>
    </div>
  </Modal>);
}

function HUD({planetId}){
  const p=PLANETS.find(x=>x.id===planetId);if(!p)return null;
  return(<div style={{position:"fixed",top:"1.5rem",left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:".4rem",zIndex:150,pointerEvents:"none"}}>
    <div style={{background:"rgba(7,7,17,.9)",backdropFilter:"blur(18px)",border:`1px solid ${p.hex}44`,borderRadius:"12px",padding:".6rem 1.3rem",display:"flex",alignItems:"center",gap:".6rem"}}>
      <span style={{fontSize:"1.1rem"}}>{p.icon}</span>
      <div><div style={{fontSize:".88rem",fontWeight:600,color:"#e8e8f0",fontFamily:"'Space Grotesk',sans-serif"}}>{p.label}</div><div style={{fontSize:".6rem",color:`${p.hex}99`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".08em"}}>{p.desc}</div></div>
      {p.moons.length===0&&<span style={{fontSize:".62rem",color:p.hex,fontFamily:"'JetBrains Mono',monospace",background:`${p.hex}18`,border:`1px solid ${p.hex}44`,borderRadius:"100px",padding:".15rem .5rem"}}>Coming Soon</span>}
    </div>
    <span style={{fontSize:".58rem",color:"rgba(232,232,240,.22)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".14em"}}>ESC · SPACE · SCROLL to return</span>
  </div>);
}

function Mobile(){
  const[openId,setOpenId]=useState(null);
  return(<div style={{minHeight:"100vh",background:"#000008",fontFamily:"'Space Grotesk',sans-serif",color:"#e8e8f0",padding:"1.5rem 1rem"}}>
    <div style={{position:"relative",maxWidth:480,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:"2rem",paddingTop:"1rem"}}><h1 style={{fontSize:"1.8rem",fontWeight:700,color:"#fff8f0"}}>Jordi</h1><p style={{color:STAR.hex,fontSize:".75rem",fontFamily:"'JetBrains Mono',monospace",marginTop:".5rem",letterSpacing:".06em"}}>Game Developer · Technical Artist · Barcelona</p></div>
      {PLANETS.map(p=>{const open=openId===p.id;return(<div key={p.id} style={{marginBottom:".7rem",background:"rgba(8,8,20,.88)",backdropFilter:"blur(16px)",border:`1px solid ${open?p.hex+"66":p.hex+"22"}`,borderRadius:"12px",overflow:"hidden",transition:"all .3s"}}>
        <div onClick={()=>setOpenId(open?null:p.id)} style={{padding:".9rem 1.1rem",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}><div style={{display:"flex",gap:".65rem",alignItems:"center"}}><span style={{fontSize:"1.2rem"}}>{p.icon}</span><div><div style={{fontWeight:600,fontSize:".9rem"}}>{p.label}</div><div style={{fontSize:".6rem",color:p.hex,fontFamily:"'JetBrains Mono',monospace",marginTop:".1rem"}}>{p.moons.length} project{p.moons.length!==1?"s":""}</div></div></div><span style={{color:p.hex,transition:"transform .3s",transform:open?"rotate(90deg)":"none"}}>›</span></div>
        {open&&p.moons.map(m=>(<div key={m.id} style={{padding:".8rem 1.1rem",borderTop:`1px solid ${p.hex}22`,background:"rgba(0,0,0,.2)"}}><div style={{fontWeight:600,fontSize:".88rem",marginBottom:".4rem"}}>{m.icon} {m.label}</div><p style={{fontSize:".8rem",lineHeight:1.65,color:"rgba(232,232,240,.65)",marginBottom:".7rem"}}>{m.desc}</p><a href="#" onClick={e=>e.preventDefault()} style={{display:"block",textAlign:"center",padding:".55rem",background:`${m.hex}18`,border:`1px solid ${m.hex}55`,borderRadius:"8px",color:m.hex,textDecoration:"none",fontSize:".82rem",fontWeight:600}}>{m.cta}</a></div>))}
        {open&&p.moons.length===0&&<div style={{padding:".8rem 1.1rem",borderTop:`1px solid ${p.hex}22`,fontSize:".8rem",color:"rgba(232,232,240,.4)",fontFamily:"'JetBrains Mono',monospace"}}>Coming soon</div>}
      </div>);})}
    </div>
  </div>);
}

function IntroScreen({onEnter}){
  return(<>
    <style>{`@keyframes introUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}@keyframes introIn{from{opacity:0}to{opacity:1}}@keyframes introBlink{0%,100%{opacity:.14}50%{opacity:.44}}`}</style>
    <div onClick={onEnter} style={{position:"fixed",inset:0,zIndex:500,background:"#000008",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none",overflow:"hidden",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(255,255,255,.4) 1px,transparent 1px)",backgroundSize:"55px 55px",opacity:.07,pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(255,255,255,.25) 1px,transparent 1px)",backgroundSize:"28px 28px",backgroundPosition:"14px 14px",opacity:.04,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:"700px",height:"700px",borderRadius:"50%",background:`radial-gradient(ellipse,${STAR.hex}0c 0%,transparent 65%)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:".65rem",color:`${STAR.hex}66`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".4em",marginBottom:"1.5rem",animation:"introIn .8s .1s both"}}>PORTFOLIO 2026</div>
        <h1 style={{fontSize:"clamp(2.2rem,5.5vw,4.8rem)",fontWeight:700,color:"rgba(255,248,240,.95)",letterSpacing:".1em",lineHeight:1,fontFamily:"'Space Grotesk',sans-serif",margin:0,animation:"introUp 1s cubic-bezier(.16,1,.3,1) both"}}>JORDI ALTISEN</h1>
        <div style={{height:"1px",background:`linear-gradient(90deg,transparent,${STAR.hex}77,transparent)`,margin:"1.5rem auto",width:"280px",animation:"introIn .6s .3s both"}}/>
        <p style={{fontSize:"clamp(.7rem,1.4vw,.85rem)",color:STAR.hex,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".22em",margin:"0 0 2.4rem",animation:"introIn .6s .4s both"}}>GAME DEVELOPER · TECHNICAL ARTIST</p>
        <p style={{fontSize:"clamp(.85rem,1.6vw,.95rem)",color:"rgba(232,232,240,.35)",fontFamily:"'Space Grotesk',sans-serif",letterSpacing:".04em",fontStyle:"italic",margin:0,animation:"introIn .8s .6s both"}}>"Where art meets engineering."</p>
      </div>
      <div style={{position:"absolute",bottom:"2.5rem",fontSize:".58rem",color:"rgba(232,232,240,.18)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".22em",animation:"introBlink 2.5s 1.2s infinite"}}>CLICK ANYWHERE TO ENTER</div>
    </div>
  </>);
}

function SolarScene({onStarClick,onMoonClick,onEnterPlanet,onExitPlanet,onHoverMoon}){
  const cvRef=useRef(null),labRefs=useRef({}),rafRef=useRef(null),hintRef=useRef(null);
  const cbRefs=useRef({onStarClick,onMoonClick,onEnterPlanet,onExitPlanet,onHoverMoon});
  useEffect(()=>{cbRefs.current={onStarClick,onMoonClick,onEnterPlanet,onExitPlanet,onHoverMoon};});
  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const W=window.innerWidth,H=window.innerHeight;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x000008,.0022);
    const camera=new THREE.PerspectiveCamera(55,W/H,.1,600);
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
    renderer.setSize(W,H);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0x000008);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    scene.add(new THREE.AmbientLight(0x111133,2.0));
    const starLight=new THREE.PointLight(0xe2943d,8,350);scene.add(starLight);
    const starLight2=new THREE.PointLight(0xffbb66,3.5,200);scene.add(starLight2);
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(400,20,10),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:`varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:NEBFRAG})));
    const mkStars=(n,rMin,rMax,sz,op,t)=>{const p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const θ=Math.random()*Math.PI*2,φ=Math.acos(2*Math.random()-1),r=rMin+Math.random()*(rMax-rMin);p[i*3]=r*Math.sin(φ)*Math.cos(θ);p[i*3+1]=r*Math.sin(φ)*Math.sin(θ);p[i*3+2]=r*Math.cos(φ);c[i*3]=t[0]+(Math.random()*.2-.1);c[i*3+1]=t[1]+(Math.random()*.2-.1);c[i*3+2]=t[2]+(Math.random()*.2-.1);}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(p,3));g.setAttribute("color",new THREE.BufferAttribute(c,3));return new THREE.Points(g,new THREE.PointsMaterial({size:sz,vertexColors:true,transparent:true,opacity:op,sizeAttenuation:false}));};
    scene.add(mkStars(1400,130,350,.8,.7,[.9,.9,1.]));scene.add(mkStars(250,90,200,1.5,.88,[1.,1.,.85]));scene.add(mkStars(30,70,150,2.5,.95,[1.,.8,.6]));
    const DN=400,dp=new Float32Array(DN*3),dv=new Float32Array(DN*3);
    const spD=i=>{dp[i*3]=-80+Math.random()*45;dp[i*3+1]=(Math.random()-.5)*55;dp[i*3+2]=(Math.random()-.5)*90;dv[i*3]=.012+Math.random()*.007;dv[i*3+1]=(Math.random()-.5)*.003;dv[i*3+2]=(Math.random()-.5)*.004;};
    for(let i=0;i<DN;i++)spD(i);
    const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute("position",new THREE.BufferAttribute(dp,3));
    scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xccccee,size:.04,transparent:true,opacity:.28,sizeAttenuation:false})));
    const starMat=new THREE.ShaderMaterial({uniforms:{u_t:{value:0}},vertexShader:VERT,fragmentShader:FRAG});
    const starMesh=new THREE.Mesh(new THREE.SphereGeometry(3.2,32,32),starMat);
    starMesh.userData={type:"star"};scene.add(starMesh);
    [[5.2,.06],[8,.028],[13,.016],[22,.007]].forEach(([r,o])=>scene.add(new THREE.Mesh(new THREE.SphereGeometry(r,16,16),new THREE.MeshBasicMaterial({color:0xe2943d,transparent:true,opacity:o,side:THREE.BackSide,depthWrite:false}))));
    const SS=Array.from({length:6},()=>{const pa=new Float32Array(6);const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pa,3));const m=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0});const l=new THREE.Line(g,m);scene.add(l);return{line:l,mat:m,geo:g,pa,active:false,life:0,x:0,y:0,z:0,dx:0,dy:0,dz:0};});
    let nextSST=8;
    const mkBelt=(n,inn,out,sz,op)=>{const p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=inn+Math.random()*(out-inn);p[i*3]=Math.cos(a)*r;p[i*3+1]=(Math.random()-.5)*2.5;p[i*3+2]=Math.sin(a)*r;}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0x998877,size:sz,transparent:true,opacity:op}));};
    const innerBelt=mkBelt(450,15.5,19,.20,.55),innerBelt2=mkBelt(55,16,18.5,.48,.40);
    scene.add(innerBelt);scene.add(innerBelt2);
    [15.5,19].forEach(r=>{const pts=[];for(let i=0;i<=128;i++){const a=(i/128)*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r));}const g=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(g,new THREE.LineDashedMaterial({color:0x665544,transparent:true,opacity:.04,dashSize:r*.2,gapSize:r*.12}));l.computeLineDistances();scene.add(l);});
    const outerBelt=mkBelt(700,40,48,.22,.62),outerBelt2=mkBelt(90,41,47,.55,.42);
    scene.add(outerBelt);scene.add(outerBelt2);
    [40,48].forEach(r=>{const pts=[];for(let i=0;i<=128;i++){const a=(i/128)*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r));}const g=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(g,new THREE.LineDashedMaterial({color:0x776655,transparent:true,opacity:.05,dashSize:r*.2,gapSize:r*.12}));l.computeLineDistances();scene.add(l);});
    const TRAIL_N=55,TRAIL_ARC=.72,trails={};
    PLANETS.forEach(p=>{const pos=new Float32Array(TRAIL_N*3),col=new Float32Array(TRAIL_N*3);const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("color",new THREE.BufferAttribute(col,3));const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.65});const line=new THREE.Line(geo,mat);scene.add(line);const pC=new THREE.Color(p.hex);trails[p.id]={geo,pos,col,mat,line,r:pC.r,g:pC.g,b:pC.b};});
    const pMeshes={},angles={},moonOrbitLines={},allTargets=[starMesh];
    const moonBumpTex=(()=>{const cv=document.createElement("canvas");cv.width=64;cv.height=64;const ctx=cv.getContext("2d");ctx.fillStyle="#808080";ctx.fillRect(0,0,64,64);for(let i=0;i<260;i++){const x=Math.random()*64,y=Math.random()*64,r=Math.random()*2.6+.4,v=90+Math.random()*110;ctx.fillStyle=`rgba(${v},${v},${v},${.12+Math.random()*.28})`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}const tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;return tex;})();
    const tmp1=new THREE.Vector3(),tmp2=new THREE.Vector3(),pv=new THREE.Vector3();
    PLANETS.forEach(p=>{
      angles[p.id]=p.startAngle;const inc=p.orbitTilt||0;
      const oPts=[];for(let i=0;i<=128;i++){const a=(i/128)*Math.PI*2;oPts.push(new THREE.Vector3(Math.cos(a)*p.orbitRadius,0,Math.sin(a)*p.orbitRadius));}
      const oLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(oPts),new THREE.LineDashedMaterial({color:new THREE.Color(p.hex),transparent:true,opacity:.22,dashSize:p.orbitRadius*.18,gapSize:p.orbitRadius*.09}));
      if(inc)oLine.rotation.x=-inc;oLine.computeLineDistances();scene.add(oLine);
      const pfrag=PF[p.id];let pMat;
      if(pfrag){pMat=new THREE.ShaderMaterial({uniforms:{u_t:{value:0},u_hover:{value:0}},vertexShader:PVERT,fragmentShader:pfrag});}
      else{const pC=new THREE.Color(p.hex);pMat=new THREE.MeshStandardMaterial({color:pC.clone().multiplyScalar(.5),emissive:pC,emissiveIntensity:.42,roughness:.55,metalness:.1});}
      const pMesh=new THREE.Mesh(new THREE.SphereGeometry(p.radius,32,32),pMat);pMesh.userData={type:"planet",id:p.id};scene.add(pMesh);allTargets.push(pMesh);
      const pC2=new THREE.Color(p.hex);
      const atmoMat=new THREE.MeshBasicMaterial({color:pC2,transparent:true,opacity:.14,side:THREE.BackSide,depthWrite:false});
      const atmo=new THREE.Mesh(new THREE.SphereGeometry(p.radius*1.32,16,16),atmoMat);scene.add(atmo);
      const haloMat=new THREE.MeshBasicMaterial({color:pC2,transparent:true,opacity:.07,side:THREE.BackSide,depthWrite:false});
      const halo=new THREE.Mesh(new THREE.SphereGeometry(p.radius*2.3,12,12),haloMat);scene.add(halo);
      const bloomMat=new THREE.MeshBasicMaterial({color:pC2,transparent:true,opacity:.025,side:THREE.BackSide,depthWrite:false});
      const bloom=new THREE.Mesh(new THREE.SphereGeometry(p.radius*3.8,10,10),bloomMat);scene.add(bloom);
      let ring=null,ring2=null;
      if(p.rings){
        const rGeo=new THREE.RingGeometry(p.radius*1.55,p.radius*2.55,64);
        const rMat=new THREE.MeshBasicMaterial({color:pC2.clone().multiplyScalar(.8),side:THREE.DoubleSide,transparent:true,opacity:.35,depthWrite:false});
        ring=new THREE.Mesh(rGeo,rMat);ring.rotation.x=Math.PI/2;ring.rotation.z=0.48;scene.add(ring);
        const rGeo2=new THREE.RingGeometry(p.radius*2.7,p.radius*3.05,64);
        const rMat2=new THREE.MeshBasicMaterial({color:pC2.clone().multiplyScalar(.5),side:THREE.DoubleSide,transparent:true,opacity:.16,depthWrite:false});
        ring2=new THREE.Mesh(rGeo2,rMat2);ring2.rotation.x=Math.PI/2;ring2.rotation.z=0.48;scene.add(ring2);
      }
      pMeshes[p.id]={mesh:pMesh,mat:pMat,isShader:!!pfrag,atmo,atmoMat,halo,haloMat,bloom,bloomMat,mMeshes:{},ring,ring2};
      p.moons.forEach(m=>{angles[m.id]=m.startAngle;
        const mOPts=[];for(let i=0;i<=64;i++){const a=(i/64)*Math.PI*2;mOPts.push(new THREE.Vector3(Math.cos(a)*m.orbitRadius,0,Math.sin(a)*m.orbitRadius));}
        const mol=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(mOPts),new THREE.LineBasicMaterial({color:new THREE.Color(m.hex),transparent:true,opacity:.16}));mol.rotation.x=m.inclination;mol.visible=false;scene.add(mol);moonOrbitLines[m.id]={line:mol};
        const molHit=new THREE.Mesh(new THREE.RingGeometry(Math.max(.05,m.orbitRadius-.16),m.orbitRadius+.16,64),new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));molHit.rotation.x=-Math.PI/2+m.inclination;molHit.userData={type:"moon",id:m.id,planetId:p.id};scene.add(molHit);allTargets.push(molHit);moonOrbitLines[m.id].hit=molHit;
        const mC=new THREE.Color(p.hex).lerp(new THREE.Color(0xffffff),.25);const mMat=new THREE.MeshStandardMaterial({color:mC.clone().multiplyScalar(.72),emissive:mC,emissiveIntensity:.36,roughness:.6,metalness:.08,bumpMap:moonBumpTex,bumpScale:.018});
        const mMesh=new THREE.Mesh(new THREE.SphereGeometry(m.radius,20,20),mMat);mMesh.userData={type:"moon",id:m.id,planetId:p.id};scene.add(mMesh);allTargets.push(mMesh);pMeshes[p.id].mMeshes[m.id]={mesh:mMesh,mat:mMat};});
    });
    const camS={mode:"solar",planetId:null,solarAngle:.8,solarDist:46,solarDistTarget:46,hAngle:.5,vAngle:.55};
    camera.position.set(38*Math.sin(.8),38,38*Math.cos(.8));camera.lookAt(0,0,0);
    const camLookAt=new THREE.Vector3(0,0,0);
    const RC=new THREE.Raycaster(),M2=new THREE.Vector2();
    let mDown=false,mMoved=false,downX=0,downY=0,lastMX=0,lastMY=0,lastHovMoon=null;
    const hov={current:null};
    const getND=e=>{const r=cv.getBoundingClientRect();M2.x=((e.clientX-r.left)/r.width)*2-1;M2.y=-((e.clientY-r.top)/r.height)*2+1;};
    const exit=()=>{if(camS.mode==="planet"){camS.mode="solar";camS.planetId=null;cbRefs.current.onExitPlanet();}};
    const onMD=e=>{mDown=true;mMoved=false;downX=e.clientX;downY=e.clientY;lastMX=e.clientX;lastMY=e.clientY;};
    const onMM=e=>{
      getND(e);RC.setFromCamera(M2,camera);const hits=RC.intersectObjects(allTargets);hov.current=hits.length?hits[0].object.userData:null;
      const newHM=hov.current?.type==="moon"?hov.current.id:null;
      if(newHM!==lastHovMoon){lastHovMoon=newHM;if(newHM){const pl=PLANETS.find(p=>p.id===hov.current.planetId);cbRefs.current.onHoverMoon?.(pl?.moons.find(m=>m.id===newHM),e.clientX,e.clientY);}else cbRefs.current.onHoverMoon?.(null,0,0);}
      if(mDown){const dx=e.clientX-downX,dy=e.clientY-downY;if(Math.abs(dx)>3||Math.abs(dy)>3)mMoved=true;
        if(mMoved){const ddx=e.clientX-lastMX,ddy=e.clientY-lastMY;if(camS.mode==="solar")camS.solarAngle-=ddx*.007;else{camS.hAngle-=ddx*.008;camS.vAngle=Math.max(.08,Math.min(1.35,camS.vAngle+ddy*.005));}}lastMX=e.clientX;lastMY=e.clientY;}
      cv.style.cursor=hov.current?"pointer":(mDown&&mMoved)?"grabbing":"grab";
    };
    const onMU=e=>{mDown=false;if(mMoved){mMoved=false;return;}mMoved=false;
      getND(e);RC.setFromCamera(M2,camera);const hits=RC.intersectObjects(allTargets);if(!hits.length)return;
      const ud=hits[0].object.userData;
      if(ud.type==="star")cbRefs.current.onStarClick();
      else if(ud.type==="planet"&&camS.mode==="solar"){camS.mode="planet";camS.planetId=ud.id;camS.hAngle=.5;camS.vAngle=.55;cbRefs.current.onEnterPlanet(ud.id);}
      else if(ud.type==="moon"&&camS.mode==="planet"&&camS.planetId===ud.planetId){const pl=PLANETS.find(p=>p.id===ud.planetId);cbRefs.current.onMoonClick(pl.moons.find(m=>m.id===ud.id));}
    };
    const onKD=e=>{if(e.key==="Escape"||e.key===" ")exit();};
    const onW=e=>{if(camS.mode==="solar")camS.solarDistTarget=Math.max(22,Math.min(100,camS.solarDistTarget+e.deltaY*.09));else if(e.deltaY>15)exit();};
    const onR=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);};
    cv.addEventListener("mousedown",onMD);cv.addEventListener("mousemove",onMM);cv.addEventListener("mouseup",onMU);cv.addEventListener("wheel",onW);window.addEventListener("keydown",onKD);window.addEventListener("resize",onR);cv.style.cursor="grab";
    let t=0;
    const loop=()=>{
      rafRef.current=requestAnimationFrame(loop);t+=.01;
      for(let i=0;i<DN;i++){dp[i*3]+=dv[i*3];dp[i*3+1]+=dv[i*3+1];dp[i*3+2]+=dv[i*3+2];if(dp[i*3]>85)spD(i);}dustGeo.attributes.position.needsUpdate=true;
      innerBelt.rotation.y+=.00018;innerBelt2.rotation.y+=.00012;outerBelt.rotation.y+=.00008;outerBelt2.rotation.y+=.00006;
      if(t>=nextSST){nextSST=t+7+Math.random()*9;const s=SS.find(s=>!s.active);if(s){s.active=true;s.life=0;const th=Math.random()*Math.PI*2,ph=(Math.random()-.5)*1.2,r=70;s.x=r*Math.cos(ph)*Math.cos(th);s.y=r*Math.sin(ph);s.z=r*Math.cos(ph)*Math.sin(th);const sp=1.4+Math.random()*.7;s.dx=-s.x/r*sp+(Math.random()-.5)*.35;s.dy=-s.y/r*sp+(Math.random()-.5)*.2;s.dz=-s.z/r*sp+(Math.random()-.5)*.35;}}
      SS.forEach(s=>{if(!s.active)return;s.life+=.01;if(s.life>.5){s.active=false;s.mat.opacity=0;return;}s.x+=s.dx;s.y+=s.dy;s.z+=s.dz;const dn=Math.sqrt(s.dx**2+s.dy**2+s.dz**2),tl=22;s.pa[0]=s.x-s.dx/dn*tl;s.pa[1]=s.y-s.dy/dn*tl;s.pa[2]=s.z-s.dz/dn*tl;s.pa[3]=s.x;s.pa[4]=s.y;s.pa[5]=s.z;s.geo.attributes.position.needsUpdate=true;const pr=s.life/.5;s.mat.opacity=pr<.3?pr/.3*.9:(1-pr)/.7*.9;});
      starMat.uniforms.u_t.value=t;starLight.intensity=6.5+Math.sin(t*2)*1.5;starLight2.intensity=3+Math.cos(t*1.4)*1.;starMesh.rotation.y+=.0018;
      PLANETS.forEach(p=>{
        const frozen=camS.mode==="planet"&&camS.planetId===p.id;if(!frozen)angles[p.id]+=p.orbitSpeed;
        const inc=p.orbitTilt||0;const px=Math.cos(angles[p.id])*p.orbitRadius,py=Math.sin(angles[p.id])*p.orbitRadius*Math.sin(inc),pz=Math.sin(angles[p.id])*p.orbitRadius*Math.cos(inc);
        const pm=pMeshes[p.id];pm.mesh.position.set(px,py,pz);pm.atmo.position.set(px,py,pz);pm.halo.position.set(px,py,pz);pm.bloom.position.set(px,py,pz);pm.mesh.rotation.y+=.005;
        if(pm.ring){pm.ring.position.set(px,py,pz);pm.ring2.position.set(px,py,pz);}
        const hv=hov.current?.id===p.id&&hov.current?.type==="planet",active=camS.mode==="planet"&&camS.planetId===p.id;
        pm.atmoMat.opacity=active?.32:hv?.24:.14;pm.haloMat.opacity=active?.14:hv?.10:.07;pm.bloomMat.opacity=active?.055:hv?.04:.025;
        if(pm.ring){pm.ring.material.opacity=active?.45:hv?.40:.35;}
        if(pm.isShader){pm.mat.uniforms.u_t.value=t;const th=active?.9:hv?.55:0;pm.mat.uniforms.u_hover.value+=(th-pm.mat.uniforms.u_hover.value)*.1;}
        else pm.mat.emissiveIntensity=active?.65:hv?.58:.42+Math.sin(t*.7+angles[p.id])*.08;
        if(trails[p.id]){const tr=trails[p.id];for(let i=0;i<TRAIL_N;i++){const a=angles[p.id]-(i/TRAIL_N)*TRAIL_ARC;tr.pos[i*3]=Math.cos(a)*p.orbitRadius;tr.pos[i*3+1]=Math.sin(a)*p.orbitRadius*Math.sin(inc);tr.pos[i*3+2]=Math.sin(a)*p.orbitRadius*Math.cos(inc);const al=((TRAIL_N-i)/TRAIL_N)*.6;tr.col[i*3]=tr.r*al;tr.col[i*3+1]=tr.g*al;tr.col[i*3+2]=tr.b*al;}tr.geo.attributes.position.needsUpdate=true;tr.geo.attributes.color.needsUpdate=true;}
        p.moons.forEach(m=>{angles[m.id]+=m.orbitSpeed;const a2=angles[m.id],ci=Math.cos(m.inclination),si=Math.sin(m.inclination);
          const mx=px+Math.cos(a2)*m.orbitRadius,my=py-Math.sin(a2)*m.orbitRadius*si,mz=pz+Math.sin(a2)*m.orbitRadius*ci;
          const mm=pm.mMeshes[m.id];mm.mesh.position.set(mx,my,mz);mm.mesh.rotation.y+=.015;
          moonOrbitLines[m.id].line.position.set(px,py,pz);moonOrbitLines[m.id].line.visible=active;
          moonOrbitLines[m.id].hit.position.set(px,py,pz);
          mm.mat.emissiveIntensity=hov.current?.id===m.id&&hov.current?.type==="moon"?1.0:active?.50+Math.sin(t+a2)*.1:.38;});
      });
      camS.solarDist+=(camS.solarDistTarget-camS.solarDist)*.09;
      const SD=camS.solarDist,SH=SD*.82;
      if(camS.mode==="solar"){tmp1.set(SD*Math.sin(camS.solarAngle),SH,SD*Math.cos(camS.solarAngle));camera.position.lerp(tmp1,.06);camLookAt.lerp(new THREE.Vector3(0,0,0),.07);}
      else{const p=PLANETS.find(x=>x.id===camS.planetId),pPos=pMeshes[p.id].mesh.position;const maxMR=p.moons.length?Math.max(...p.moons.map(m=>m.orbitRadius)):p.radius;const dist=Math.max(maxMR*2.8,p.radius*7);tmp1.set(pPos.x+dist*Math.sin(camS.hAngle)*Math.cos(camS.vAngle),pPos.y+p.radius*5+dist*Math.sin(camS.vAngle),pPos.z+dist*Math.cos(camS.hAngle)*Math.cos(camS.vAngle));camera.position.lerp(tmp1,.06);tmp2.copy(pPos);camLookAt.lerp(tmp2,.08);}
      camera.lookAt(camLookAt);
      if(hintRef.current)hintRef.current.textContent=camS.mode==="planet"?"DRAG TO ORBIT · CLICK MOONS · ESC":"DRAG · SCROLL TO ZOOM · CLICK PLANETS";
      const cw=renderer.domElement.clientWidth,ch=renderer.domElement.clientHeight;
      ALL_ITEMS.forEach(item=>{const el=labRefs.current[item.id];if(!el)return;
        if(item.type==="star")pv.set(0,4.2,0);
        else if(item.type==="planet"){const pm=pMeshes[item.id];pv.copy(pm.mesh.position);pv.y+=PLANETS.find(p=>p.id===item.id).radius+.6;}
        else{const p=PLANETS.find(x=>x.id===item.planetId);const mm=pMeshes[item.planetId].mMeshes[item.id];pv.copy(mm.mesh.position);pv.y+=p.moons.find(m=>m.id===item.id).radius+.2;}
        pv.project(camera);if(pv.z>1){el.style.opacity="0";return;}
        el.style.left=(pv.x+1)/2*cw+"px";el.style.top=(-pv.y+1)/2*ch+"px";
        const hv=hov.current?.id===item.id,inS=camS.mode==="solar",inP=camS.mode==="planet",apid=camS.planetId;
        const vis=(item.type==="star")||(item.type==="planet"&&(inS||(inP&&item.id===apid)))||(item.type==="moon"&&inP&&item.planetId===apid);
        el.style.opacity=vis?(hv?"1":".75"):"0";el.style.transform=`translate(-50%,-100%) translateY(-4px) scale(${hv?1.08:1})`;});
      renderer.render(scene,camera);
    };
    loop();
    return()=>{cancelAnimationFrame(rafRef.current);cv.removeEventListener("mousedown",onMD);cv.removeEventListener("mousemove",onMM);cv.removeEventListener("mouseup",onMU);cv.removeEventListener("wheel",onW);window.removeEventListener("keydown",onKD);window.removeEventListener("resize",onR);renderer.dispose();};
  },[]);
  return(<div style={{position:"relative",width:"100%",height:"100%"}}>
    <canvas ref={cvRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
    {ALL_ITEMS.map(item=>(<div key={item.id} ref={el=>{labRefs.current[item.id]=el;}} style={{position:"absolute",pointerEvents:"none",fontFamily:"'Space Grotesk',sans-serif",transition:"opacity .2s,transform .2s",userSelect:"none"}}><div style={{fontSize:item.type==="moon"?".65rem":".73rem",fontWeight:600,color:"#e8e8f0",whiteSpace:"nowrap",background:"rgba(5,5,14,.78)",backdropFilter:"blur(6px)",padding:item.type==="moon"?".15rem .42rem":".2rem .58rem",borderRadius:"5px",border:`1px solid ${item.hex}33`,textShadow:`0 0 12px ${item.hex}`}}>{item.icon} {item.label}</div></div>))}
    <div style={{position:"absolute",top:"1.5rem",left:"1.5rem",fontFamily:"'Space Grotesk',sans-serif",userSelect:"none"}}>
      <div style={{fontSize:"1.05rem",fontWeight:700,color:"rgba(255,248,240,.92)",letterSpacing:".04em",textShadow:`0 0 24px ${STAR.hex}22`}}>Jordi</div>
      <div style={{fontSize:".57rem",color:`${STAR.hex}88`,letterSpacing:".1em",marginTop:".2rem",fontFamily:"'JetBrains Mono',monospace"}}>Building worlds and tools, one system at a time.</div>
    </div>
    <div ref={hintRef} style={{position:"absolute",bottom:"1.5rem",left:"1.5rem",fontFamily:"'JetBrains Mono',monospace",fontSize:".57rem",color:`${STAR.hex}44`,letterSpacing:".12em",userSelect:"none"}}/>
    <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 40%,rgba(0,0,8,.5) 100%)"}}/>
  </div>);
}

export default function Portfolio(){
  const[activePlanetId,setActivePlanetId]=useState(null);
  const[panelData,setPanelData]=useState(null);
  const[isMobile,setIsMobile]=useState(false);
  const[warp,setWarp]=useState(false);
  const[hovMoon,setHovMoon]=useState({data:null,x:0,y:0});
  const[audioOn,setAudioOn]=useState(false);
  const[muted,setMuted]=useState(false);
  const[intro,setIntro]=useState(true);
  const audioRef=useRef(null);
  const initAudio=useCallback(()=>{if(audioRef.current)return;try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const master=ctx.createGain();master.gain.value=.025;master.connect(ctx.destination);[55,82.5,110].forEach((f,i)=>{const o=ctx.createOscillator();o.type="sine";o.frequency.value=f;const g=ctx.createGain();g.gain.value=1-i*.28;o.connect(g);g.connect(master);o.start();});const lfo=ctx.createOscillator();lfo.frequency.value=.06;const lg=ctx.createGain();lg.gain.value=.008;lfo.connect(lg);lg.connect(master.gain);lfo.start();audioRef.current={ctx,master};setAudioOn(true);}catch(e){}},[]);
  useEffect(()=>{
    if(!document.getElementById("pf-css")){const el=document.createElement("style");el.id="pf-css";el.textContent=CSS;document.head.appendChild(el);}
    const chk=()=>setIsMobile(window.innerWidth<680);chk();window.addEventListener("resize",chk);
    const fc=()=>{initAudio();window.removeEventListener("click",fc);};window.addEventListener("click",fc);
    return()=>{window.removeEventListener("resize",chk);window.removeEventListener("click",fc);};
  },[initAudio]);
  const playEnterSound=useCallback(()=>{if(!audioRef.current||muted)return;const{ctx}=audioRef.current;const o=ctx.createOscillator();const g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(350,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(70,ctx.currentTime+.4);g.gain.setValueAtTime(.12,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.45);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.45);},[muted]);
  const toggleMute=useCallback(()=>{if(!audioRef.current)return;setMuted(prev=>{audioRef.current.master.gain.value=prev?.025:0;return!prev;});},[]);
  const onStarClick=useCallback(()=>setPanelData({type:"star"}),[]);
  const onMoonClick=useCallback(proj=>setPanelData({type:"project",project:proj}),[]);
  const onEnterPlanet=useCallback(id=>{setActivePlanetId(id);setPanelData(null);setWarp(true);setTimeout(()=>setWarp(false),550);playEnterSound();},[playEnterSound]);
  const onExitPlanet=useCallback(()=>{setActivePlanetId(null);setPanelData(null);},[]);
  const onHoverMoon=useCallback((data,x,y)=>setHovMoon({data,x,y}),[]);
  if(intro)return <IntroScreen onEnter={()=>{setIntro(false);initAudio();}}/>;
  if(isMobile)return <Mobile/>;
  return(<div style={{width:"100%",height:"100vh",background:"#000008",overflow:"hidden",position:"relative"}}>
    <SolarScene onStarClick={onStarClick} onMoonClick={onMoonClick} onEnterPlanet={onEnterPlanet} onExitPlanet={onExitPlanet} onHoverMoon={onHoverMoon}/>
    {activePlanetId&&<HUD planetId={activePlanetId}/>}
    {panelData?.type==="star"&&<StarPanel onClose={()=>setPanelData(null)}/>}
    {panelData?.type==="project"&&<ProjectPanel project={panelData.project} onClose={()=>setPanelData(null)}/>}
    {hovMoon.data&&!panelData&&<MoonTooltip moon={hovMoon.data} x={hovMoon.x} y={hovMoon.y}/>}
    {warp&&<div style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none",background:"radial-gradient(ellipse at center,rgba(180,220,255,.14) 0%,rgba(100,160,255,.06) 45%,transparent 70%)",animation:"warpIn .55s ease-out forwards"}}/>}
    <StatusBar/>
    {audioOn&&<button onClick={toggleMute} style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",background:"rgba(7,7,17,.85)",border:`1px solid ${STAR.hex}${muted?"33":"66"}`,borderRadius:"8px",padding:".38rem .65rem",color:muted?"rgba(232,232,240,.3)":STAR.hex,cursor:"pointer",fontSize:".65rem",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".1em",zIndex:100,transition:"all .2s"}}>{muted?"🔇":"🔊"}</button>}
  </div>);
}

import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import Svg, { Line, Circle, Path, Text as ST, Rect } from "react-native-svg";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

type Config = "1ph-120-240" | "1ph-480-120" | "delta-wye" | "wye-delta" | "delta-delta" | "wye-wye" | "open-delta";

const CONFIGS: Array<[Config, string, string]> = [
  ["1ph-120-240",  "1-Phase",   "120/240V Center Tap"],
  ["1ph-480-120",  "1-Phase",   "480V → 120/240V"],
  ["delta-wye",    "3-Phase",   "Delta → Wye (Most Common)"],
  ["wye-delta",    "3-Phase",   "Wye → Delta"],
  ["delta-delta",  "3-Phase",   "Delta → Delta"],
  ["wye-wye",      "3-Phase",   "Wye → Wye"],
  ["open-delta",   "3-Phase",   "Open Delta (V-V)"],
];

const INFO: Record<Config, { primary: string; secondary: string; use: string; notes: string[] }> = {
  "1ph-120-240": {
    primary:   "H1, H2 — connect to 120V or 240V source",
    secondary: "X1, X2 — 240V across both  |  X1/X3 or X2/X3 — 120V",
    use:       "Residential service, small commercial",
    notes: [
      "X3 is the center tap — connect to neutral bar and ground",
      "240V loads connect across X1 and X2",
      "120V loads connect between X1 or X2 and X3 (neutral)",
      "Always verify polarity with a meter before energizing",
    ],
  },
  "1ph-480-120": {
    primary:   "H1, H2 — connect to 480V source",
    secondary: "X1, X2 — 240V  |  X1/X3 or X2/X3 — 120V",
    use:       "Step-down for control circuits, lighting",
    notes: [
      "Common for control transformers in industrial panels",
      "X3 center tap bonded to ground at secondary",
      "Fuse primary at 125% of rated primary current per NEC 450.3",
      "Keep primary and secondary wiring separated",
    ],
  },
  "delta-wye": {
    primary:   "H1, H2, H3 — Delta connected (no neutral)",
    secondary: "X1, X2, X3, X0 — Wye with neutral (X0)",
    use:       "480V Delta → 208/120V Wye — most common commercial",
    notes: [
      "X0 is the neutral — bond to ground at secondary (SDS)",
      "System bonding jumper required at X0 per NEC 250.30",
      "Provides 208V line-to-line and 120V line-to-neutral",
      "30° phase shift between primary and secondary",
      "Most common transformer in commercial buildings",
      "480V Delta primary has no neutral — do not attempt to ground",
    ],
  },
  "wye-delta": {
    primary:   "H1, H2, H3, H0 — Wye with neutral",
    secondary: "X1, X2, X3 — Delta (no neutral)",
    use:       "Step-up applications, drive isolation transformers",
    notes: [
      "Secondary Delta provides no neutral — 3-wire system only",
      "Used for motor drives and equipment requiring isolation",
      "H0 neutral bonded at primary if separately derived",
      "High leg (wild leg) not present in this configuration",
      "Less common than Delta-Wye in commercial applications",
    ],
  },
  "delta-delta": {
    primary:   "H1, H2, H3 — Delta (no neutral)",
    secondary: "X1, X2, X3 — Delta (no neutral)",
    use:       "Industrial motor loads, no neutral required",
    notes: [
      "No neutral on either side — 3-wire system",
      "One corner of secondary delta can be grounded (corner-grounded delta)",
      "High leg (wild leg) present if center tap used on one winding",
      "High leg is 208V to ground — must be identified with orange tape",
      "Used where neutral is not needed and isolation is desired",
      "Can continue operating with one transformer failed (open delta)",
    ],
  },
  "wye-wye": {
    primary:   "H1, H2, H3, H0 — Wye with neutral",
    secondary: "X1, X2, X3, X0 — Wye with neutral",
    use:       "Utility distribution, rarely used in commercial",
    notes: [
      "Both sides have neutrals — 4-wire systems on both sides",
      "Susceptible to third harmonic problems without delta winding",
      "Not recommended without delta tertiary winding",
      "Consult engineer before specifying Wye-Wye",
      "Used mainly by utilities at transmission voltages",
    ],
  },
  "open-delta": {
    primary:   "H1, H2, H3 — two transformers, three phases",
    secondary: "X1, X2, X3 — Delta output from two units",
    use:       "Emergency backup, temporary 3-phase from 2 transformers",
    notes: [
      "Uses only 2 single-phase transformers to provide 3-phase",
      "Capacity is only 57.7% of full closed delta bank",
      "Both transformers must be identical kVA and voltage ratings",
      "Useful when one transformer in a delta bank fails",
      "Power factor and voltage regulation are poorer than closed delta",
      "Not recommended for permanent installations with large loads",
    ],
  },
};

// ─── SVG Diagrams ──────────────────────────────────────────────
const W = 320, H = 200;

function Diagram1Ph240() {
  return (
    <Svg width={W} height={H}>
      {/* Core */}
      <Rect x="130" y="40" width="60" height="120" fill="#2a2a2a" stroke="#333" strokeWidth="1" rx="4"/>
      <ST x="160" y="105" fill="#888" fontSize="10" textAnchor="middle">CORE</ST>

      {/* Primary winding */}
      <Path d="M80,60 Q95,60 95,75 Q95,90 80,90 Q95,90 95,105 Q95,120 80,120 Q95,120 95,135 Q95,150 80,150" stroke="#f5a623" strokeWidth="3" fill="none"/>
      <Line x1="40" y1="70" x2="80" y2="70" stroke="#f5a623" strokeWidth="2"/>
      <Line x1="40" y1="140" x2="80" y2="140" stroke="#f5a623" strokeWidth="2"/>
      <ST x="30" y="73" fill="#f5a623" fontSize="11" fontWeight="700" textAnchor="middle">H1</ST>
      <ST x="30" y="143" fill="#f5a623" fontSize="11" fontWeight="700" textAnchor="middle">H2</ST>
      <ST x="60" y="35" fill="#f5a623" fontSize="10" textAnchor="middle">PRIMARY</ST>

      {/* Secondary winding */}
      <Path d="M240,60 Q225,60 225,75 Q225,90 240,90 Q225,90 225,105 Q225,120 240,120 Q225,120 225,135 Q225,150 240,150" stroke="#4caf50" strokeWidth="3" fill="none"/>
      <Line x1="240" y1="70" x2="280" y2="70" stroke="#4caf50" strokeWidth="2"/>
      <Line x1="240" y1="105" x2="280" y2="105" stroke="#888" strokeWidth="2" strokeDasharray="4,2"/>
      <Line x1="240" y1="140" x2="280" y2="140" stroke="#4caf50" strokeWidth="2"/>
      <ST x="292" y="73" fill="#4caf50" fontSize="11" fontWeight="700" textAnchor="middle">X1</ST>
      <ST x="292" y="108" fill="#888" fontSize="11" fontWeight="700" textAnchor="middle">X3</ST>
      <ST x="292" y="143" fill="#4caf50" fontSize="11" fontWeight="700" textAnchor="middle">X2</ST>
      <ST x="260" y="35" fill="#4caf50" fontSize="10" textAnchor="middle">SECONDARY</ST>

      {/* Center tap label */}
      <ST x="310" y="120" fill="#ff9800" fontSize="9" textAnchor="middle">CTR</ST>
      <ST x="310" y="130" fill="#ff9800" fontSize="9" textAnchor="middle">TAP</ST>

      {/* Voltage labels */}
      <ST x="160" y="185" fill="#888" fontSize="10" textAnchor="middle">240V across X1-X2  |  120V from X1 or X2 to X3</ST>
    </Svg>
  );
}

function DiagramDeltaWye() {
  return (
    <Svg width={W} height={H}>
      {/* PRIMARY — Delta triangle */}
      <ST x="70" y="18" fill="#f5a623" fontSize="10" fontWeight="700" textAnchor="middle">PRIMARY (Delta)</ST>
      <Path d="M30,170 L70,50 L110,170 Z" stroke="#f5a623" strokeWidth="3" fill="none"/>
      {/* H terminals */}
      <Circle cx="30" cy="170" r="4" fill="#f5a623"/>
      <Circle cx="110" cy="170" r="4" fill="#f5a623"/>
      <Circle cx="70" cy="50" r="4" fill="#f5a623"/>
      <ST x="18" y="185" fill="#f5a623" fontSize="11" fontWeight="700">H1</ST>
      <ST x="105" y="185" fill="#f5a623" fontSize="11" fontWeight="700">H3</ST>
      <ST x="62" y="42" fill="#f5a623" fontSize="11" fontWeight="700">H2</ST>

      {/* SECONDARY — Wye star */}
      <ST x="250" y="18" fill="#4caf50" fontSize="10" fontWeight="700" textAnchor="middle">SECONDARY (Wye)</ST>
      {/* Center point */}
      <Circle cx="250" cy="130" r="4" fill="#4caf50"/>
      {/* Three arms */}
      <Line x1="250" y1="126" x2="220" y2="60" stroke="#4caf50" strokeWidth="3"/>
      <Line x1="250" y1="126" x2="280" y2="60" stroke="#4caf50" strokeWidth="3"/>
      <Line x1="250" y1="130" x2="250" y2="185" stroke="#888" strokeWidth="2" strokeDasharray="4,2"/>
      {/* X terminals */}
      <Circle cx="220" cy="60" r="4" fill="#4caf50"/>
      <Circle cx="280" cy="60" r="4" fill="#4caf50"/>
      <Circle cx="250" cy="185" r="4" fill="#888"/>
      <ST x="205" y="55" fill="#4caf50" fontSize="11" fontWeight="700">X1</ST>
      <ST x="284" y="55" fill="#4caf50" fontSize="11" fontWeight="700">X2</ST>
      <ST x="258" y="198" fill="#888" fontSize="11" fontWeight="700">X0</ST>

      {/* Third phase arm */}
      <Line x1="254" y1="128" x2="305" y2="128" stroke="#4caf50" strokeWidth="3"/>
      <Circle cx="305" cy="128" r="4" fill="#4caf50"/>
      <ST x="312" y="132" fill="#4caf50" fontSize="11" fontWeight="700">X3</ST>

      {/* Neutral label */}
      <ST x="160" y="185" fill="#888" fontSize="9" textAnchor="middle">X0 = Neutral — bond to ground  |  208V L-L  |  120V L-N</ST>
    </Svg>
  );
}

function DiagramDeltaDelta() {
  return (
    <Svg width={W} height={H}>
      {/* PRIMARY — Delta */}
      <ST x="70" y="18" fill="#f5a623" fontSize="10" fontWeight="700" textAnchor="middle">PRIMARY (Delta)</ST>
      <Path d="M20,170 L70,45 L120,170 Z" stroke="#f5a623" strokeWidth="3" fill="none"/>
      <Circle cx="20" cy="170" r="4" fill="#f5a623"/>
      <Circle cx="120" cy="170" r="4" fill="#f5a623"/>
      <Circle cx="70" cy="45" r="4" fill="#f5a623"/>
      <ST x="8" y="185" fill="#f5a623" fontSize="11" fontWeight="700">H1</ST>
      <ST x="114" y="185" fill="#f5a623" fontSize="11" fontWeight="700">H3</ST>
      <ST x="62" y="38" fill="#f5a623" fontSize="11" fontWeight="700">H2</ST>

      {/* SECONDARY — Delta */}
      <ST x="250" y="18" fill="#4caf50" fontSize="10" fontWeight="700" textAnchor="middle">SECONDARY (Delta)</ST>
      <Path d="M200,170 L250,45 L300,170 Z" stroke="#4caf50" strokeWidth="3" fill="none"/>
      <Circle cx="200" cy="170" r="4" fill="#4caf50"/>
      <Circle cx="300" cy="170" r="4" fill="#4caf50"/>
      <Circle cx="250" cy="45" r="4" fill="#4caf50"/>
      <ST x="188" y="185" fill="#4caf50" fontSize="11" fontWeight="700">X1</ST>
      <ST x="294" y="185" fill="#4caf50" fontSize="11" fontWeight="700">X3</ST>
      <ST x="242" y="38" fill="#4caf50" fontSize="11" fontWeight="700">X2</ST>

      <ST x="160" y="198" fill="#888" fontSize="9" textAnchor="middle">No neutral — 3-wire system  |  Corner ground optional</ST>
    </Svg>
  );
}

function DiagramWyeDelta() {
  return (
    <Svg width={W} height={H}>
      {/* PRIMARY — Wye */}
      <ST x="75" y="18" fill="#f5a623" fontSize="10" fontWeight="700" textAnchor="middle">PRIMARY (Wye)</ST>
      <Circle cx="75" cy="130" r="4" fill="#f5a623"/>
      <Line x1="75" y1="126" x2="45" y2="60" stroke="#f5a623" strokeWidth="3"/>
      <Line x1="75" y1="126" x2="105" y2="60" stroke="#f5a623" strokeWidth="3"/>
      <Line x1="75" y1="130" x2="75" y2="185" stroke="#f5a623" strokeWidth="2" strokeDasharray="4,2"/>
      <Line x1="79" y1="128" x2="130" y2="128" stroke="#f5a623" strokeWidth="3"/>
      <Circle cx="45" cy="60" r="4" fill="#f5a623"/>
      <Circle cx="105" cy="60" r="4" fill="#f5a623"/>
      <Circle cx="130" cy="128" r="4" fill="#f5a623"/>
      <Circle cx="75" cy="185" r="4" fill="#f5a623"/>
      <ST x="30" y="55" fill="#f5a623" fontSize="11" fontWeight="700">H1</ST>
      <ST x="108" y="55" fill="#f5a623" fontSize="11" fontWeight="700">H2</ST>
      <ST x="136" y="132" fill="#f5a623" fontSize="11" fontWeight="700">H3</ST>
      <ST x="68" y="198" fill="#f5a623" fontSize="11" fontWeight="700">H0</ST>

      {/* SECONDARY — Delta */}
      <ST x="250" y="18" fill="#4caf50" fontSize="10" fontWeight="700" textAnchor="middle">SECONDARY (Delta)</ST>
      <Path d="M200,170 L250,45 L300,170 Z" stroke="#4caf50" strokeWidth="3" fill="none"/>
      <Circle cx="200" cy="170" r="4" fill="#4caf50"/>
      <Circle cx="300" cy="170" r="4" fill="#4caf50"/>
      <Circle cx="250" cy="45" r="4" fill="#4caf50"/>
      <ST x="188" y="185" fill="#4caf50" fontSize="11" fontWeight="700">X1</ST>
      <ST x="294" y="185" fill="#4caf50" fontSize="11" fontWeight="700">X3</ST>
      <ST x="242" y="38" fill="#4caf50" fontSize="11" fontWeight="700">X2</ST>

      <ST x="160" y="198" fill="#888" fontSize="9" textAnchor="middle">H0 = neutral at primary  |  No neutral on secondary</ST>
    </Svg>
  );
}

function DiagramWyeWye() {
  return (
    <Svg width={W} height={H}>
      {/* PRIMARY — Wye */}
      <ST x="75" y="18" fill="#f5a623" fontSize="10" fontWeight="700" textAnchor="middle">PRIMARY (Wye)</ST>
      <Circle cx="75" cy="125" r="4" fill="#f5a623"/>
      <Line x1="75" y1="121" x2="45" y2="55" stroke="#f5a623" strokeWidth="3"/>
      <Line x1="75" y1="121" x2="105" y2="55" stroke="#f5a623" strokeWidth="3"/>
      <Line x1="75" y1="129" x2="75" y2="180" stroke="#f5a623" strokeWidth="2" strokeDasharray="4,2"/>
      <Line x1="79" y1="125" x2="125" y2="125" stroke="#f5a623" strokeWidth="3"/>
      <Circle cx="45" cy="55" r="4" fill="#f5a623"/>
      <Circle cx="105" cy="55" r="4" fill="#f5a623"/>
      <Circle cx="125" cy="125" r="4" fill="#f5a623"/>
      <Circle cx="75" cy="180" r="4" fill="#f5a623"/>
      <ST x="30" y="50" fill="#f5a623" fontSize="11" fontWeight="700">H1</ST>
      <ST x="108" y="50" fill="#f5a623" fontSize="11" fontWeight="700">H2</ST>
      <ST x="130" y="129" fill="#f5a623" fontSize="11" fontWeight="700">H3</ST>
      <ST x="68" y="193" fill="#f5a623" fontSize="11" fontWeight="700">H0</ST>

      {/* SECONDARY — Wye */}
      <ST x="245" y="18" fill="#4caf50" fontSize="10" fontWeight="700" textAnchor="middle">SECONDARY (Wye)</ST>
      <Circle cx="245" cy="125" r="4" fill="#4caf50"/>
      <Line x1="245" y1="121" x2="215" y2="55" stroke="#4caf50" strokeWidth="3"/>
      <Line x1="245" y1="121" x2="275" y2="55" stroke="#4caf50" strokeWidth="3"/>
      <Line x1="245" y1="129" x2="245" y2="180" stroke="#888" strokeWidth="2" strokeDasharray="4,2"/>
      <Line x1="249" y1="125" x2="295" y2="125" stroke="#4caf50" strokeWidth="3"/>
      <Circle cx="215" cy="55" r="4" fill="#4caf50"/>
      <Circle cx="275" cy="55" r="4" fill="#4caf50"/>
      <Circle cx="295" cy="125" r="4" fill="#4caf50"/>
      <Circle cx="245" cy="180" r="4" fill="#888"/>
      <ST x="200" y="50" fill="#4caf50" fontSize="11" fontWeight="700">X1</ST>
      <ST x="278" y="50" fill="#4caf50" fontSize="11" fontWeight="700">X2</ST>
      <ST x="300" y="129" fill="#4caf50" fontSize="11" fontWeight="700">X3</ST>
      <ST x="238" y="193" fill="#888" fontSize="11" fontWeight="700">X0</ST>

      <ST x="160" y="198" fill="#ff9800" fontSize="9" textAnchor="middle">Caution: Consult engineer — harmonic issues without delta winding</ST>
    </Svg>
  );
}

function DiagramOpenDelta() {
  return (
    <Svg width={W} height={H}>
      {/* Transformer 1 */}
      <Rect x="30" y="50" width="30" height="100" fill="#2a2a2a" stroke="#333" strokeWidth="1" rx="3"/>
      <ST x="45" y="105" fill="#888" fontSize="9" textAnchor="middle">T1</ST>
      {/* Transformer 2 */}
      <Rect x="260" y="50" width="30" height="100" fill="#2a2a2a" stroke="#333" strokeWidth="1" rx="3"/>
      <ST x="275" y="105" fill="#888" fontSize="9" textAnchor="middle">T2</ST>

      {/* Primary connections */}
      <ST x="160" y="18" fill="#f5a623" fontSize="10" fontWeight="700" textAnchor="middle">PRIMARY</ST>
      <Line x1="60" y1="70" x2="160" y2="30" stroke="#f5a623" strokeWidth="2"/>
      <Line x1="60" y1="130" x2="260" y2="130" stroke="#f5a623" strokeWidth="2"/>
      <Line x1="260" y1="70" x2="160" y2="30" stroke="#f5a623" strokeWidth="2"/>
      <Circle cx="160" cy="30" r="4" fill="#f5a623"/>
      <Circle cx="60" cy="70" r="4" fill="#f5a623"/>
      <Circle cx="260" cy="70" r="4" fill="#f5a623"/>
      <Circle cx="60" cy="130" r="4" fill="#f5a623"/>
      <Circle cx="260" cy="130" r="4" fill="#f5a623"/>
      <ST x="160" y="22" fill="#f5a623" fontSize="11" fontWeight="700" textAnchor="middle">H2</ST>
      <ST x="20" y="73" fill="#f5a623" fontSize="11" fontWeight="700">H1</ST>
      <ST x="293" y="73" fill="#f5a623" fontSize="11" fontWeight="700">H3</ST>

      {/* Secondary connections */}
      <ST x="160" y="175" fill="#4caf50" fontSize="10" fontWeight="700" textAnchor="middle">SECONDARY</ST>
      <Line x1="60" y1="80" x2="160" y2="160" stroke="#4caf50" strokeWidth="2"/>
      <Line x1="60" y1="120" x2="260" y2="120" stroke="#4caf50" strokeWidth="2" strokeDasharray="4,2"/>
      <Line x1="260" y1="80" x2="160" y2="160" stroke="#4caf50" strokeWidth="2"/>
      <Circle cx="160" cy="160" r="4" fill="#4caf50"/>
      <ST x="160" y="168" fill="#4caf50" fontSize="11" fontWeight="700" textAnchor="middle">X2</ST>
      <ST x="20" y="83" fill="#4caf50" fontSize="11" fontWeight="700">X1</ST>
      <ST x="293" y="83" fill="#4caf50" fontSize="11" fontWeight="700">X3</ST>

      <ST x="160" y="195" fill="#ff9800" fontSize="9" textAnchor="middle">57.7% capacity of full delta bank — temporary use only</ST>
    </Svg>
  );
}

function TransformerInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);

  const DIAGRAMS: Record<Config, React.ReactNode> = {
    "1ph-120-240": <Diagram1Ph240/>,
    "1ph-480-120": <Diagram1Ph240/>,
    "delta-wye":   <DiagramDeltaWye/>,
    "wye-delta":   <DiagramWyeDelta/>,
    "delta-delta": <DiagramDeltaDelta/>,
    "wye-wye":     <DiagramWyeWye/>,
    "open-delta":  <DiagramOpenDelta/>,
  };
  const [selected, setSelected] = useState<Config>("delta-wye");
  const info = INFO[selected];

  // Group by phase
  const singlePhase = CONFIGS.filter(([,phase]) => phase === "1-Phase");
  const threePhase  = CONFIGS.filter(([,phase]) => phase === "3-Phase");

  return (
    <ScrollView style={s.scroll}>

      {/* ── Config selector ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Single Phase</Text>
        <View style={s.selectRow}>
          {singlePhase.map(([key,, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.sfBtn, { flex:1 }, selected===key && s.sfBtnActive]}
              onPress={() => setSelected(key)}
            >
              <Text style={[s.sfBtnText, { fontSize:11 }, selected===key && s.sfBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.cardTitle, { marginTop:10 }]}>Three Phase</Text>
        <View style={s.selectRow}>
          {threePhase.map(([key,, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.sfBtn, { minWidth:80 }, selected===key && s.sfBtnActive]}
              onPress={() => setSelected(key)}
            >
              <Text style={[s.sfBtnText, { fontSize:10 }, selected===key && s.sfBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Diagram ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Wiring Diagram</Text>
        <View style={{ alignItems:"center", paddingVertical:8 }}>
          {DIAGRAMS[selected]}
        </View>
      </View>

      {/* ── Terminal Reference ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Terminal Reference</Text>

        <View style={{ marginBottom:10 }}>
          <Text style={[s.label, { color:C.accent, fontWeight:"700" }]}>Primary (H Terminals)</Text>
          <Text style={{ color:C.text, fontSize:13, lineHeight:20 }}>{info.primary}</Text>
        </View>

        <View style={{ marginBottom:10 }}>
          <Text style={[s.label, { color:C.pass, fontWeight:"700" }]}>Secondary (X Terminals)</Text>
          <Text style={{ color:C.text, fontSize:13, lineHeight:20 }}>{info.secondary}</Text>
        </View>

        <View style={{ marginBottom:10 }}>
          <Text style={[s.label, { color:C.muted, fontWeight:"700" }]}>Typical Use</Text>
          <Text style={{ color:C.text, fontSize:13, lineHeight:20 }}>{info.use}</Text>
        </View>
      </View>

      {/* ── Notes ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Field Notes</Text>
        {info.notes.map((note, i) => (
          <View key={i} style={{ flexDirection:"row", paddingVertical:6, borderBottomWidth: i < info.notes.length-1 ? 1 : 0, borderBottomColor:C.input }}>
            <Text style={{ color:C.accent, fontSize:13, marginRight:8 }}>›</Text>
            <Text style={{ color:C.text, fontSize:13, flex:1, lineHeight:20 }}>{note}</Text>
          </View>
        ))}
        <Text style={[s.infoText, { marginTop:10 }]}>
          Always verify connections against the transformer nameplate and manufacturer wiring diagram before energizing. Follow NEC Article 450 for transformer installation requirements.
        </Text>
      </View>

    </ScrollView>
  );
}

export function TransformerScreen() {
  return <ProGate feature="Transformer Wiring Diagrams"><TransformerInner/></ProGate>;
}

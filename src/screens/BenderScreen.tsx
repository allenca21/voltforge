import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, TextInput } from "react-native";
import Svg, { Line, Path, Text as ST } from "react-native-svg";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

// ─── NEC / trade data ──────────────────────────────────────────
const DEDUCTS: Record<string,number>  = {"0.5":5,"0.75":6,"1":8,"1.25":11,"1.5":13,"2":16,"2.5":22,"3":27,"3.5":32,"4":37};
const GAIN_90: Record<string,number>  = {"0.5":3,"0.75":4,"1":6,"1.25":8,"1.5":11,"2":14,"2.5":19,"3":23,"3.5":27,"4":31};
const EMT_SIZES = ["0.5","0.75","1","1.25","1.5","2","2.5","3","3.5","4"];
const EMT_LABELS: Record<string,string> = {"0.5":'½"',"0.75":'¾"',"1":'1"',"1.25":'1¼"',"1.5":'1½"',"2":'2"',"2.5":'2½"',"3":'3"',"3.5":'3½"',"4":'4"'};

const SHRINK_PER: Record<string,number> = {"10":0.06,"22.5":0.136,"30":0.2,"45":0.414,"60":0.577};
const MULT: Record<string,number>       = {"10":5.76,"22.5":2.613,"30":2.0,"45":1.414,"60":1.155};

type BendType = "stub"|"b2b"|"offset"|"saddle3"|"saddle4"|"rolling";

const BEND_BUTTONS: Array<[BendType,string]> = [
  ["stub",    "90° Stub"],
  ["b2b",     "Back-to-Back"],
  ["offset",  "Offset"],
  ["saddle3", "3-Pt Saddle"],
  ["saddle4", "4-Pt Saddle"],
  ["rolling", "Rolling Offset"],
];

// ─── SVG Diagrams ──────────────────────────────────────────────
const W = 300, H = 150;

function DiagramStub() {
  return (
    <Svg width={W} height={H}>
      <Line x1="30" y1="115" x2="120" y2="115" stroke="#888" strokeWidth="4" strokeLinecap="round"/>
      <Path d="M120,115 Q145,115 145,90" stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <Line x1="145" y1="90" x2="145" y2="25" stroke="#f5a623" strokeWidth="4" strokeLinecap="round"/>
      <Line x1="114" y1="104" x2="114" y2="126" stroke="#4caf50" strokeWidth="2"/>
      <ST x="118" y="100" fill="#4caf50" fontSize="11" fontWeight="700">mark</ST>
      <Line x1="155" y1="25" x2="155" y2="115" stroke="#ff9800" strokeWidth="1" strokeDasharray="4,3"/>
      <ST x="160" y="75" fill="#ff9800" fontSize="11">stub H</ST>
    </Svg>
  );
}

function DiagramB2B() {
  return (
    <Svg width={W} height={H}>
      <Line x1="10" y1="115" x2="75" y2="115" stroke="#888" strokeWidth="4" strokeLinecap="round"/>
      <Path d="M75,115 Q100,115 100,90" stroke="#f5a623" strokeWidth="4" fill="none"/>
      <Line x1="100" y1="90" x2="195" y2="90" stroke="#f5a623" strokeWidth="4" strokeLinecap="round"/>
      <Path d="M195,90 Q220,90 220,115" stroke="#f5a623" strokeWidth="4" fill="none"/>
      <Line x1="220" y1="115" x2="280" y2="115" stroke="#888" strokeWidth="4" strokeLinecap="round"/>
      <Line x1="75"  y1="103" x2="75"  y2="127" stroke="#4caf50" strokeWidth="2"/>
      <Line x1="220" y1="103" x2="220" y2="127" stroke="#4caf50" strokeWidth="2"/>
      <ST x="62"  y="140" fill="#4caf50" fontSize="11" fontWeight="700">M1</ST>
      <ST x="210" y="140" fill="#4caf50" fontSize="11" fontWeight="700">M2</ST>
      <Line x1="75" y1="75" x2="220" y2="75" stroke="#ff9800" strokeWidth="1" strokeDasharray="4,3"/>
      <ST x="130" y="70" fill="#ff9800" fontSize="10">B-to-B dist</ST>
    </Svg>
  );
}

function DiagramOffset() {
  return (
    <Svg width={W} height={H}>
      <Line x1="10" y1="60"  x2="90"  y2="60"  stroke="#888"  strokeWidth="4" strokeLinecap="round"/>
      <Path d="M90,60 L150,105"                  stroke="#f5a623" strokeWidth="4" strokeLinecap="round"/>
      <Line x1="150" y1="105" x2="290" y2="105" stroke="#f5a623" strokeWidth="4" strokeLinecap="round"/>
      <Line x1="90"  y1="48"  x2="90"  y2="72"  stroke="#4caf50" strokeWidth="2"/>
      <Line x1="150" y1="93"  x2="150" y2="117" stroke="#4caf50" strokeWidth="2"/>
      <ST x="72"  y="43"  fill="#4caf50" fontSize="11" fontWeight="700">M1</ST>
      <ST x="137" y="88"  fill="#4caf50" fontSize="11" fontWeight="700">M2</ST>
      <Line x1="220" y1="60" x2="220" y2="105" stroke="#ff9800" strokeWidth="1" strokeDasharray="4,3"/>
      <ST x="224" y="86" fill="#ff9800" fontSize="11">H</ST>
    </Svg>
  );
}

function DiagramSaddle3() {
  return (
    <Svg width={W} height={H}>
      <Line x1="10"  y1="110" x2="75"  y2="110" stroke="#888"  strokeWidth="4" strokeLinecap="round"/>
      <Path d="M75,110 L110,58 L185,58 L220,110"  stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <Line x1="220" y1="110" x2="285" y2="110" stroke="#888"  strokeWidth="4" strokeLinecap="round"/>
      <Line x1="75"  y1="98"  x2="75"  y2="122" stroke="#4caf50" strokeWidth="2"/>
      <Line x1="148" y1="46"  x2="148" y2="70"  stroke="#4caf50" strokeWidth="2"/>
      <Line x1="220" y1="98"  x2="220" y2="122" stroke="#4caf50" strokeWidth="2"/>
      <ST x="62"  y="136" fill="#4caf50" fontSize="11" fontWeight="700">M1</ST>
      <ST x="136" y="42"  fill="#4caf50" fontSize="11" fontWeight="700">M2</ST>
      <ST x="208" y="136" fill="#4caf50" fontSize="11" fontWeight="700">M3</ST>
    </Svg>
  );
}

function DiagramSaddle4() {
  return (
    <Svg width={W} height={H}>
      <Line x1="5"   y1="110" x2="60"  y2="110" stroke="#888"  strokeWidth="4" strokeLinecap="round"/>
      <Path d="M60,110 L90,65 L190,65 L220,110"  stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <Line x1="220" y1="110" x2="285" y2="110" stroke="#888"  strokeWidth="4" strokeLinecap="round"/>
      <Line x1="60"  y1="98"  x2="60"  y2="122" stroke="#4caf50" strokeWidth="2"/>
      <Line x1="90"  y1="53"  x2="90"  y2="77"  stroke="#4caf50" strokeWidth="2"/>
      <Line x1="190" y1="53"  x2="190" y2="77"  stroke="#4caf50" strokeWidth="2"/>
      <Line x1="220" y1="98"  x2="220" y2="122" stroke="#4caf50" strokeWidth="2"/>
      <ST x="50"  y="136" fill="#4caf50" fontSize="10" fontWeight="700">M1</ST>
      <ST x="80"  y="48"  fill="#4caf50" fontSize="10" fontWeight="700">M2</ST>
      <ST x="180" y="48"  fill="#4caf50" fontSize="10" fontWeight="700">M3</ST>
      <ST x="210" y="136" fill="#4caf50" fontSize="10" fontWeight="700">M4</ST>
    </Svg>
  );
}

function DiagramRolling() {
  return (
    <Svg width={W} height={H}>
      <Line x1="20"  y1="90" x2="100" y2="90"  stroke="#888"  strokeWidth="4" strokeLinecap="round"/>
      <Path d="M100,90 L150,45"                  stroke="#f5a623" strokeWidth="4" strokeLinecap="round"/>
      <Line x1="150" y1="45" x2="270" y2="45"   stroke="#f5a623" strokeWidth="4" strokeLinecap="round"/>
      <Line x1="100" y1="90" x2="200" y2="90"   stroke="#ff9800" strokeWidth="1" strokeDasharray="4,3"/>
      <Line x1="200" y1="45" x2="200" y2="90"   stroke="#ff9800" strokeWidth="1" strokeDasharray="4,3"/>
      <ST x="135" y="105" fill="#ff9800" fontSize="11">run</ST>
      <ST x="205" y="72"  fill="#ff9800" fontSize="11">rise</ST>
      <Line x1="100" y1="78" x2="100" y2="102"  stroke="#4caf50" strokeWidth="2"/>
      <Line x1="150" y1="33" x2="150" y2="57"   stroke="#4caf50" strokeWidth="2"/>
      <ST x="83"  y="116" fill="#4caf50" fontSize="11" fontWeight="700">M1</ST>
      <ST x="137" y="28"  fill="#4caf50" fontSize="11" fontWeight="700">M2</ST>
    </Svg>
  );
}

// ─── Ft/In helpers ─────────────────────────────────────────────
function toInches(ft: string, inches: string): number {
  const f = parseFloat(ft) || 0;
  const i = parseFloat(inches) || 0;
  return f * 12 + i;
}

function formatFraction(remainder: number): string {
  // Round to nearest 1/8"
  const eighths = Math.round(remainder * 8);
  if (eighths === 0) return "";
  if (eighths === 8) return ""; // will be handled by carrying over
  const fracs: Record<number,string> = {1:"⅛", 2:"¼", 3:"⅜", 4:"½", 5:"⅝", 6:"¾", 7:"⅞"};
  return fracs[eighths] ?? "";
}

function formatInches(totalInches: number): string {
  if (totalInches <= 0) return `0"`;
  // Round to nearest 1/8"
  const rounded = Math.round(totalInches * 8) / 8;
  const wholeInches = Math.floor(rounded);
  const remainder = rounded - wholeInches;
  const fracStr = formatFraction(remainder);

  if (rounded < 12) {
    return fracStr ? `${wholeInches} ${fracStr}"` : `${wholeInches}"`;
  }
  const feet = Math.floor(wholeInches / 12);
  const remInches = wholeInches % 12;
  // handle case where rounding pushed remainder to full inch
  const extraInch = remainder >= 0.9375 ? 1 : 0;
  const finalInches = remInches + extraInch;
  const finalFrac = extraInch ? "" : fracStr;

  if (finalInches === 0 && !finalFrac) return `${feet}'`;
  if (!finalFrac) return `${feet}' ${finalInches}"`;
  if (finalInches === 0) return `${feet}' ${finalFrac}"`;
  return `${feet}' ${finalInches} ${finalFrac}"`;
}

// ─── Main component ────────────────────────────────────────────
function BenderInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);
  const [bendType, setBendType] = useState<BendType>("stub");
  const [size,     setSize]     = useState("0.75");
  // A input — feet and inches
  const [AFt, setAFt] = useState("");
  const [AIn, setAIn] = useState("");
  // B input — feet and inches
  const [BFt, setBFt] = useState("");
  const [BIn, setBIn] = useState("");
  const [angle, setAngle] = useState("30");

  const a   = toInches(AFt, AIn);
  const b   = toInches(BFt, BIn);
  const aValid = a > 0;
  const bValid = b > 0;
  const ang = parseFloat(angle);
  const ded = DEDUCTS[size] ?? 6;
  const g   = GAIN_90[size] ?? 4;

  const clearA = () => { setAFt(""); setAIn(""); };
  const clearB = () => { setBFt(""); setBIn(""); };

  // ── Calculation engine ──────────────────────────────────────
  let marks: Array<{label:string; value:string}> = [];
  let steps: string[] = [];
  let extra: string[] = [];

  if (bendType === "stub" && aValid) {
    const mark = a - ded;
    marks = [{ label:"Mark from end", value: formatInches(mark) }];
    steps = [
      `Measure ${formatInches(mark)} from end of conduit`,
      "Align bender arrow to mark",
      "Bend to exactly 90°",
      `Verify stub height = ${formatInches(a)}`,
    ];
    extra = [`Deduct for ${EMT_LABELS[size]}: ${ded}"`, `Stub height: ${formatInches(a)}`];
  }

  else if (bendType === "b2b" && aValid) {
    const m1 = (a - g) / 2;
    const m2 = m1 + (a - g);
    marks = [
      { label:"1st mark from end", value: formatInches(m1) },
      { label:"2nd mark from end", value: formatInches(m2) },
    ];
    steps = [
      `Mark ${formatInches(m1)} from end — bend 1st mark to 90°`,
      `Mark ${formatInches(m2)} from end — flip conduit`,
      "Bend 2nd mark to 90° — bends face same direction",
      `Verify inside distance = ${formatInches(a)}`,
    ];
    extra = [`Gain for ${EMT_LABELS[size]}: ${g}"`, `B-to-B distance: ${formatInches(a)}`];
  }

  else if (bendType === "offset" && aValid) {
    const rad        = ang * Math.PI / 180;
    const spread     = a / Math.sin(rad);
    const shrink     = a * (SHRINK_PER[angle] ?? 0.2);
    const multiplier = MULT[angle] ?? 2.0;
    marks = [
      { label:"1st mark (reference)", value:`0"` },
      { label:"2nd mark from 1st",    value: formatInches(spread) },
    ];
    steps = [
      `Bend both marks to ${ang}° — bends parallel`,
      `Conduit steps over ${formatInches(a)}`,
      `Add ${formatInches(shrink)} to layout length for shrinkage`,
    ];
    extra = [
      `Multiplier for ${ang}°: ${multiplier}  (spread = H × ${multiplier})`,
      `Shrinkage: ${formatInches(shrink)}`,
    ];
  }

  else if (bendType === "saddle3" && aValid) {
    const rad    = ang * Math.PI / 180;
    const spread = a / Math.sin(rad);
    marks = [
      { label:"M1 — 1st side bend", value:`reference` },
      { label:"M2 — center bend",    value:`${formatInches(spread)} from M1` },
      { label:"M3 — 2nd side bend",  value:`${formatInches(spread * 2)} from M1` },
    ];
    steps = [
      `M1 & M3: bend ${ang}° (same direction — up)`,
      `M2 (center): bend ${ang * 2}° opposite direction (down)`,
      "Check conduit clears obstruction",
    ];
    extra = [`Obstruction height: ${formatInches(a)}`, `Side angle: ${ang}°`, `Center angle: ${ang * 2}°`];
  }

  else if (bendType === "saddle4" && aValid && bValid) {
    const spread = a / Math.sin(30 * Math.PI / 180);
    marks = [
      { label:"M1 — reference", value:`0"` },
      { label:"M2 from M1",     value: formatInches(spread) },
      { label:"M3 from M1",     value: formatInches(spread + b) },
      { label:"M4 from M1",     value: formatInches(spread * 2 + b) },
    ];
    steps = [
      "All four bends are 30°",
      "M1 & M4 bend same direction (up)",
      "M2 & M3 bend opposite direction (down)",
      "Conduit bridges the obstruction cleanly",
    ];
    extra = [`Obstruction height: ${formatInches(a)}`, `Obstruction width: ${formatInches(b)}`];
  }

  else if (bendType === "rolling" && aValid && bValid) {
    const trueOffset = Math.sqrt(a * a + b * b);
    const rollAngle  = Math.atan2(b, a) * (180 / Math.PI);
    const spread30   = trueOffset / Math.sin(30 * Math.PI / 180);
    const shrink30   = trueOffset * SHRINK_PER["30"];
    marks = [
      { label:"True offset",  value: formatInches(trueOffset) },
      { label:"Roll angle",   value:`${rollAngle.toFixed(2)}°` },
      { label:"Spread (30°)", value: formatInches(spread30) },
    ];
    steps = [
      `Roll conduit ${rollAngle.toFixed(1)}° before bending`,
      "Bend as standard 30° offset using spread above",
      "Result clears both horizontal & vertical obstacles",
    ];
    extra = [`Run: ${formatInches(a)}`, `Rise: ${formatInches(b)}`, `Shrinkage: ${formatInches(shrink30)}`];
  }

  const hasResult = marks.length > 0;

  const DIAGRAMS: Record<BendType, React.ReactNode> = {
    stub:    <DiagramStub/>,
    b2b:     <DiagramB2B/>,
    offset:  <DiagramOffset/>,
    saddle3: <DiagramSaddle3/>,
    saddle4: <DiagramSaddle4/>,
    rolling: <DiagramRolling/>,
  };

  // ── Ft/In input helper ──────────────────────────────────────
  const FtInInput = ({
    label, ft, setFt, inches, setInches, placeholder
  }: {
    label:string; ft:string; setFt:(v:string)=>void;
    inches:string; setInches:(v:string)=>void; placeholder?:string;
  }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection:"row", gap:8, marginBottom:10 }}>
        <View style={{ flex:1 }}>
          <TextInput
            style={s.input}
            keyboardType="number-pad"
            value={ft}
            onChangeText={setFt}
            placeholder="0"
            placeholderTextColor={C.muted}
          />
          <Text style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:-8, marginBottom:6 }}>feet</Text>
        </View>
        <View style={{ flex:1 }}>
          <TextInput
            style={s.input}
            keyboardType="decimal-pad"
            value={inches}
            onChangeText={setInches}
            placeholder={placeholder || "0"}
            placeholderTextColor={C.muted}
          />
          <Text style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:-8, marginBottom:6 }}>inches</Text>
        </View>
        {(ft || inches) ? (
          <View style={{ justifyContent:"center", paddingBottom:14 }}>
            <Text style={{ color:C.accent, fontSize:12, fontWeight:"700" }}>
              = {formatInches(toInches(ft, inches))}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* ── Bend type ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Bend Type</Text>
        <View style={s.selectRow}>
          {BEND_BUTTONS.map(([v,l]) => (
            <TouchableOpacity
              key={v}
              style={[s.sfBtn, {minWidth:100}, bendType===v && s.sfBtnActive]}
              onPress={()=>{ setBendType(v as BendType); clearA(); clearB(); }}
            >
              <Text style={[s.sfBtnText, bendType===v && s.sfBtnTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.cardTitle}>EMT Size</Text>
        <View style={s.selectRow}>
          {EMT_SIZES.map(sz => (
            <TouchableOpacity key={sz} style={[s.sfBtn, size===sz && s.sfBtnActive]} onPress={()=>setSize(sz)}>
              <Text style={[s.sfBtnText, size===sz && s.sfBtnTextActive]}>{EMT_LABELS[sz]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Inputs ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Measurements</Text>

        {bendType === "stub" && (
          <FtInInput label="Desired stub height" ft={AFt} setFt={setAFt} inches={AIn} setInches={setAIn} placeholder="e.g. 10"/>
        )}

        {bendType === "b2b" && (
          <FtInInput label="Inside distance between bends" ft={AFt} setFt={setAFt} inches={AIn} setInches={setAIn} placeholder="e.g. 6"/>
        )}

        {bendType === "offset" && (
          <>
            <FtInInput label="Offset height" ft={AFt} setFt={setAFt} inches={AIn} setInches={setAIn} placeholder="e.g. 6"/>
            <Text style={s.label}>Bend angle</Text>
            <View style={s.selectRow}>
              {["10","22.5","30","45","60"].map(ag => (
                <TouchableOpacity key={ag} style={[s.sfBtn, angle===ag && s.sfBtnActive]} onPress={()=>setAngle(ag)}>
                  <Text style={[s.sfBtnText, angle===ag && s.sfBtnTextActive]}>{ag}°</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {bendType === "saddle3" && (
          <>
            <FtInInput label="Obstruction height" ft={AFt} setFt={setAFt} inches={AIn} setInches={setAIn} placeholder="e.g. 4"/>
            <Text style={s.label}>Side bend angle</Text>
            <View style={s.selectRow}>
              {["22.5","30","45"].map(ag => (
                <TouchableOpacity key={ag} style={[s.sfBtn, angle===ag && s.sfBtnActive]} onPress={()=>setAngle(ag)}>
                  <Text style={[s.sfBtnText, angle===ag && s.sfBtnTextActive]}>{ag}°</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {bendType === "saddle4" && (
          <>
            <FtInInput label="Obstruction height" ft={AFt} setFt={setAFt} inches={AIn} setInches={setAIn} placeholder="e.g. 4"/>
            <FtInInput label="Obstruction width"  ft={BFt} setFt={setBFt} inches={BIn} setInches={setBIn} placeholder="e.g. 8"/>
          </>
        )}

        {bendType === "rolling" && (
          <>
            <FtInInput label="Horizontal run" ft={AFt} setFt={setAFt} inches={AIn} setInches={setAIn} placeholder="e.g. 6"/>
            <FtInInput label="Vertical rise"  ft={BFt} setFt={setBFt} inches={BIn} setInches={setBIn} placeholder="e.g. 4"/>
          </>
        )}
      </View>

      {/* ── Results — shown immediately when inputs are valid ── */}
      {hasResult && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Calculated Marks</Text>
          {marks.map((m, i) => (
            <View key={i} style={s.resultRow}>
              <Text style={s.resultLabel}>{m.label}</Text>
              <Text style={[s.resultValue, { fontSize:15 }]}>{m.value}</Text>
            </View>
          ))}

          {extra.length > 0 && (
            <View style={{ backgroundColor:"#1e1e1e", borderRadius:6, padding:10, marginTop:10 }}>
              {extra.map((e, i) => (
                <Text key={i} style={{ color:C.muted, fontSize:12, lineHeight:20 }}>• {e}</Text>
              ))}
            </View>
          )}

          <Text style={[s.cardTitle, { marginTop:14 }]}>Step-by-Step</Text>
          {steps.map((st, i) => (
            <View key={i} style={{ flexDirection:"row", marginTop:8 }}>
              <View style={{ backgroundColor:C.accent, borderRadius:10, width:20, height:20, alignItems:"center", justifyContent:"center", marginRight:10, marginTop:1 }}>
                <Text style={{ color:"#111", fontSize:11, fontWeight:"700" }}>{i+1}</Text>
              </View>
              <Text style={{ color:C.text, fontSize:13, flex:1, lineHeight:20 }}>{st}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── SVG Diagram ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Bend Diagram</Text>
        <View style={{ alignItems:"center", paddingVertical:8 }}>
          {DIAGRAMS[bendType]}
        </View>
        <Text style={[s.infoText, { textAlign:"center" }]}>
          Deduct for {EMT_LABELS[size]} EMT: {ded}"  •  Gain per 90°: {g}"
        </Text>
      </View>

    </ScrollView>
  );
}

export function BenderScreen() {
  return <ProGate feature="Conduit Bending Calculator"><BenderInner/></ProGate>;
}

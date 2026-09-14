import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

// Conductor weight per foot (lbs/ft) for 3 conductors — THHN copper
const WIRE_WEIGHT: Record<string, number> = {
  "14":0.058,"12":0.079,"10":0.123,"8":0.196,"6":0.281,
  "4":0.429,"3":0.514,"2":0.623,"1":0.778,"1/0":0.950,
  "2/0":1.160,"3/0":1.430,"4/0":1.760,"250":2.070,"350":2.780,
  "500":3.820,"600":4.540,"750":5.590,"1000":7.250,
};

// Weight correction factor for conductor configuration
// Cradle (3 conductors): 1.0, Triangular (triplex): 0.867
const CONFIG_FACTOR: Record<string, number> = {
  cradle: 1.00,
  triangular: 0.867,
};

// Max pulling tension per conductor (lbs) = 0.008 × CM (circular mils) for copper
const MAX_TENSION_CM: Record<string, number> = {
  "14":32,"12":52,"10":83,"8":132,"6":209,
  "4":333,"3":420,"2":530,"1":668,"1/0":843,
  "2/0":1064,"3/0":1342,"4/0":1692,"250":2000,"350":2800,
  "500":4000,"600":4800,"750":6000,"1000":8000,
};

const AWG_SIZES = ["14","12","10","8","6","4","3","2","1","1/0","2/0","3/0","4/0","250","350","500","600","750","1000"];

type Segment = { type: "straight" | "bend"; length: string; angle: string };

function PullTensionInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);
  const [awg,       setAwg]       = useState("4");
  const [numWires,  setNumWires]  = useState("3");
  const [config,    setConfig]    = useState<"cradle"|"triangular">("cradle");
  const [friction,  setFriction]  = useState<"dry"|"lubed">("lubed");
  const [segments,  setSegments]  = useState<Segment[]>([
    { type:"straight", length:"100", angle:"0" },
    { type:"bend",     length:"0",   angle:"90" },
    { type:"straight", length:"50",  angle:"0" },
  ]);

  const mu   = friction === "dry" ? 0.50 : 0.15;
  const nw   = parseInt(numWires) || 1;
  const wt   = (WIRE_WEIGHT[awg] ?? 0) * nw * CONFIG_FACTOR[config];
  const maxT = (MAX_TENSION_CM[awg] ?? 0) * nw;

  // Calculate cumulative tension through segments
  let tension = 0;
  const segResults: Array<{ label:string; tension:number; swp?:number }> = [];

  segments.forEach((seg, i) => {
    if (seg.type === "straight") {
      const len = parseFloat(seg.length) || 0;
      const addT = wt * mu * len;
      tension += addT;
      segResults.push({ label: `Straight ${len}ft`, tension });
    } else {
      const angleDeg = parseFloat(seg.angle) || 90;
      const angleRad = angleDeg * Math.PI / 180;
      const incomingT = tension;
      tension = tension * Math.exp(mu * angleRad);
      // Sidewall pressure = tension_out / bend_radius_ft
      // Standard hand bender radius ≈ 6× trade size, assume 1ft for simplicity
      const bendRadiusFt = 1.0;
      const swp = tension / bendRadiusFt;
      segResults.push({ label: `${angleDeg}° Bend`, tension, swp });
    }
  });

  const finalTension = tension;
  const tensionOK    = finalTension <= maxT;
  const tensionColor = tensionOK ? C.pass : C.fail;

  const addStraight = () => setSegments([...segments, { type:"straight", length:"50", angle:"0" }]);
  const addBend     = () => setSegments([...segments, { type:"bend",     length:"0",  angle:"90" }]);
  const removeSeg   = (i: number) => setSegments(segments.filter((_, j) => j !== i));

  const updateSeg = (i: number, key: keyof Segment, val: string) => {
    const next = [...segments];
    next[i] = { ...next[i], [key]: val };
    setSegments(next);
  };

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* ── Conductor Setup ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Conductor Setup</Text>

        <Text style={s.label}>AWG / kcmil Size</Text>
        <View style={[s.selectRow, { marginBottom:10 }]}>
          {AWG_SIZES.map(a => (
            <TouchableOpacity key={a} style={[s.sfBtn, { minWidth:44 }, awg===a && s.sfBtnActive]} onPress={() => setAwg(a)}>
              <Text style={[s.sfBtnText, { fontSize:10 }, awg===a && s.sfBtnTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>Number of Conductors</Text>
            <TextInput style={s.input} keyboardType="number-pad" value={numWires} onChangeText={setNumWires} placeholder="3"/>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>Configuration</Text>
            <View style={s.selectRow}>
              {(["cradle","triangular"] as const).map(c => (
                <TouchableOpacity key={c} style={[s.sfBtn, { flex:1 }, config===c && s.sfBtnActive]} onPress={() => setConfig(c)}>
                  <Text style={[s.sfBtnText, { fontSize:10 }, config===c && s.sfBtnTextActive]}>{c === "cradle" ? "Cradle" : "Triangular"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={s.label}>Lubrication</Text>
        <View style={s.selectRow}>
          <TouchableOpacity style={[s.sfBtn, { flex:1 }, friction==="lubed" && s.sfBtnActive]} onPress={() => setFriction("lubed")}>
            <Text style={[s.sfBtnText, friction==="lubed" && s.sfBtnTextActive]}>Lubricated (μ=0.15)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.sfBtn, { flex:1 }, friction==="dry" && s.sfBtnActive]} onPress={() => setFriction("dry")}>
            <Text style={[s.sfBtnText, friction==="dry" && s.sfBtnTextActive]}>Dry (μ=0.50)</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.resultBox, { marginTop:10 }]}>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Wire Weight (lbs/ft)</Text>
            <Text style={s.resultValue}>{wt.toFixed(3)}</Text>
          </View>
          <View style={[s.resultRow, { borderBottomWidth:0 }]}>
            <Text style={s.resultLabel}>Max Pull Tension</Text>
            <Text style={s.resultValue}>{maxT.toLocaleString()} lbs</Text>
          </View>
        </View>
      </View>

      {/* ── Pull Route ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Pull Route</Text>
        <Text style={[s.infoText, { marginBottom:10 }]}>
          Add segments in order from feed end to pull end. Tension accumulates — bends multiply incoming tension.
        </Text>

        {segments.map((seg, i) => (
          <View key={i} style={{ backgroundColor:C.input, borderRadius:8, padding:12, marginBottom:10, borderWidth:1, borderColor:C.border }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <View style={{ flexDirection:"row", gap:6 }}>
                <TouchableOpacity
                  style={[{ paddingHorizontal:10, paddingVertical:4, borderRadius:4 },
                    seg.type==="straight" ? { backgroundColor:C.accent } : { backgroundColor:C.input }]}
                  onPress={() => updateSeg(i, "type", "straight")}
                >
                  <Text style={{ fontSize:11, color: seg.type==="straight" ? "#111" : C.muted, fontWeight:"700" }}>Straight</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ paddingHorizontal:10, paddingVertical:4, borderRadius:4 },
                    seg.type==="bend" ? { backgroundColor:C.accent } : { backgroundColor:C.input }]}
                  onPress={() => updateSeg(i, "type", "bend")}
                >
                  <Text style={{ fontSize:11, color: seg.type==="bend" ? "#111" : C.muted, fontWeight:"700" }}>Bend</Text>
                </TouchableOpacity>
              </View>
              {segments.length > 1 && (
                <TouchableOpacity style={s.rmBtn} onPress={() => removeSeg(i)}>
                  <Text style={s.rmText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {seg.type === "straight" ? (
              <>
                <Text style={s.label}>Length (ft)</Text>
                <TextInput style={[s.input, { width:100 }]} keyboardType="decimal-pad" value={seg.length} onChangeText={v => updateSeg(i, "length", v)} placeholder="50"/>
              </>
            ) : (
              <>
                <Text style={s.label}>Bend Angle</Text>
                <View style={s.selectRow}>
                  {["22.5","30","45","90"].map(ag => (
                    <TouchableOpacity key={ag} style={[s.sfBtn, seg.angle===ag && s.sfBtnActive]} onPress={() => updateSeg(i, "angle", ag)}>
                      <Text style={[s.sfBtnText, seg.angle===ag && s.sfBtnTextActive]}>{ag}°</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {segResults[i] && (
              <Text style={{ color:C.muted, fontSize:11, marginTop:4 }}>
                Tension after: <Text style={{ color:C.accent, fontWeight:"700" }}>{segResults[i].tension.toFixed(0)} lbs</Text>
                {segResults[i].swp !== undefined && (
                  <Text style={{ color: segResults[i].swp! > 300 ? C.fail : C.muted }}>
                    {`  |  SWP: ${segResults[i].swp!.toFixed(0)} lbs/ft${segResults[i].swp! > 300 ? " ⚠ OVER 300" : ""}`}
                  </Text>
                )}
              </Text>
            )}
          </View>
        ))}

        <View style={[s.row, { gap:8 }]}>
          <TouchableOpacity style={[s.btn, s.btnOutline, { flex:1 }]} onPress={addStraight}>
            <Text style={s.btnOutlineText}>+ Straight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnOutline, { flex:1 }]} onPress={addBend}>
            <Text style={s.btnOutlineText}>+ Bend</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Results ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Pull Summary</Text>
        <View style={s.resultBox}>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Total Pull Tension</Text>
            <Text style={[s.resultValue, { color: tensionColor }]}>{finalTension.toFixed(0)} lbs</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Max Allowable</Text>
            <Text style={s.resultValue}>{maxT.toLocaleString()} lbs</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Margin</Text>
            <Text style={[s.resultValue, { color: tensionColor }]}>
              {tensionOK
                ? `${((1 - finalTension/maxT)*100).toFixed(0)}% under limit`
                : `${((finalTension/maxT - 1)*100).toFixed(0)}% OVER limit`}
            </Text>
          </View>
          <View style={[s.resultRow, { borderBottomWidth:0 }]}>
            <Text style={s.resultLabel}>Status</Text>
            <Text style={[s.resultValue, { color: tensionColor }]}>
              {tensionOK ? "✔ PASS — within limits" : "✘ FAIL — exceeds max tension"}
            </Text>
          </View>
        </View>

        {!tensionOK && (
          <View style={{ backgroundColor:C.input, borderWidth:1, borderColor:C.fail, borderRadius:6, padding:12, marginTop:10 }}>
            <Text style={{ color:C.fail, fontWeight:"700", fontSize:13, marginBottom:6 }}>Remedies to Reduce Tension:</Text>
            <Text style={{ color:"#ccc", fontSize:12, lineHeight:20 }}>
              • Use pulling lubricant — reduces friction from 0.50 to 0.15{"\n"}
              • Add a pull box to break up the run{"\n"}
              • Use sweep elbows instead of standard bends{"\n"}
              • Pull from the end with the most bends{"\n"}
              • Use a larger conduit size{"\n"}
              • Upsize to the next conductor size
            </Text>
          </View>
        )}

        <Text style={s.infoText}>
          Straight tension: T = weight × μ × length{"\n"}
          Bend tension: T_out = T_in × e^(μ × angle_rad){"\n"}
          Max tension = 0.008 × CM (circular mils) per conductor{"\n"}
          Sidewall pressure limit: 300 lbs/ft per NEC 300.34
        </Text>
      </View>

    </ScrollView>
  );
}

export function PullTensionScreen() {
  return <ProGate feature="Wire Pull Tension Calculator"><PullTensionInner/></ProGate>;
}

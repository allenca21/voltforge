import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";

const wireData = [
  { awg:"14",   cu:[15,20,25],    al:["-","-","-"],   oc:15,  cm:4110   },
  { awg:"12",   cu:[20,25,30],    al:[15,20,25],       oc:20,  cm:6530   },
  { awg:"10",   cu:[30,35,40],    al:[25,30,35],       oc:30,  cm:10380  },
  { awg:"8",    cu:[40,50,55],    al:[30,40,45],       oc:40,  cm:16510  },
  { awg:"6",    cu:[55,65,75],    al:[40,50,60],       oc:60,  cm:26240  },
  { awg:"4",    cu:[70,85,95],    al:[55,65,75],       oc:70,  cm:41740  },
  { awg:"3",    cu:[85,100,110],  al:[65,75,85],       oc:85,  cm:52620  },
  { awg:"2",    cu:[95,115,130],  al:[75,90,100],      oc:95,  cm:66360  },
  { awg:"1",    cu:[110,130,150], al:[85,100,115],     oc:110, cm:83690  },
  { awg:"1/0",  cu:[125,150,170], al:[100,120,135],    oc:125, cm:105600 },
  { awg:"2/0",  cu:[145,175,195], al:[115,135,150],    oc:145, cm:133100 },
  { awg:"3/0",  cu:[165,200,225], al:[130,155,175],    oc:165, cm:167800 },
  { awg:"4/0",  cu:[195,230,260], al:[150,180,205],    oc:195, cm:211600 },
  { awg:"250",  cu:[215,255,290], al:[170,205,230],    oc:215, cm:250000 },
  { awg:"300",  cu:[240,285,320], al:[195,230,260],    oc:240, cm:300000 },
  { awg:"350",  cu:[260,310,350], al:[210,250,280],    oc:260, cm:350000 },
  { awg:"400",  cu:[280,335,380], al:[225,270,305],    oc:280, cm:400000 },
  { awg:"500",  cu:[320,380,430], al:[260,310,350],    oc:320, cm:500000 },
  { awg:"600",  cu:[350,420,475], al:[285,340,385],    oc:350, cm:600000 },
  { awg:"750",  cu:[400,475,535], al:[320,385,435],    oc:400, cm:750000 },
  { awg:"1000", cu:[455,545,615], al:[375,445,500],    oc:455, cm:1000000},
];

const DERATE: Array<[string, number]> = [
  ["4–6 CCC",   0.80],
  ["7–9 CCC",   0.70],
  ["10–20 CCC", 0.50],
  ["21–30 CCC", 0.45],
  ["31–40 CCC", 0.40],
  ["41+ CCC",   0.35],
];

const TEMP_CORRECTION: Array<[string, number, number, number]> = [
  // [ambient °C, 60°C factor, 75°C factor, 90°C factor]
  ["10°C",  1.29, 1.20, 1.15],
  ["15°C",  1.22, 1.15, 1.12],
  ["20°C",  1.15, 1.11, 1.08],
  ["25°C",  1.08, 1.05, 1.04],
  ["30°C",  1.00, 1.00, 1.00],
  ["35°C",  0.91, 0.94, 0.96],
  ["40°C",  0.82, 0.88, 0.91],
  ["45°C",  0.71, 0.82, 0.87],
  ["50°C",  0.58, 0.75, 0.82],
  ["60°C",  0.00, 0.58, 0.71],
  ["70°C",  0.00, 0.33, 0.58],
];

export function WireScreen() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);
  const [mat,    setMat]    = useState<"cu"|"al">("cu");
  const [q,      setQ]      = useState("");
  const [tab,    setTab]    = useState<"table"|"derate"|"temp">("table");
  const [cccCount, setCccCount] = useState("");
  const [baseAmp,  setBaseAmp]  = useState("");
  const [tempIdx,  setTempIdx]  = useState(5); // 35°C default
  const [colIdx,   setColIdx]   = useState(1); // 75°C default

  const filtered = wireData.filter(w =>
    w.awg.toLowerCase().includes(q.toLowerCase())
  );

  // Derate calc
  const base = parseFloat(baseAmp);
  const ccc  = parseInt(cccCount);
  let deratedAmps = "";
  if (!isNaN(base) && !isNaN(ccc) && ccc > 3) {
    const row = DERATE.find((_, i) => {
      const mins = [4,7,10,21,31,41];
      const maxs = [6,9,20,30,40,Infinity];
      return ccc >= mins[i] && ccc <= maxs[i];
    });
    if (row) deratedAmps = (base * row[1]).toFixed(1) + "A  (" + (row[1]*100).toFixed(0) + "% derating)";
  } else if (!isNaN(base) && !isNaN(ccc) && ccc <= 3) {
    deratedAmps = base.toFixed(1) + "A  (no derating required)";
  }

  // Temp correction calc
  const tempRow = TEMP_CORRECTION[tempIdx];
  const correctionFactor = tempRow ? tempRow[colIdx + 1] : 1;
  let correctedAmps = "";
  if (!isNaN(base) && base > 0) {
    correctedAmps = (base * correctionFactor).toFixed(1) + "A";
  }

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* Tab switcher */}
      <View style={[s.card, { marginBottom:8 }]}>
        <View style={s.selectRow}>
          {(["table","derate","temp"] as const).map(t => (
            <TouchableOpacity key={t} style={[s.sfBtn, { flex:1 }, tab===t && s.sfBtnActive]} onPress={() => setTab(t)}>
              <Text style={[s.sfBtnText, tab===t && s.sfBtnTextActive]}>
                {t === "table" ? "Ampacity" : t === "derate" ? "Derate" : "Temp Corr."}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Ampacity Table ── */}
      {tab === "table" && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Ampacity — NEC Table 310.15(B)</Text>

          <View style={[s.selectRow, { marginBottom:10 }]}>
            {(["cu","al"] as const).map(m => (
              <TouchableOpacity key={m} style={[s.sfBtn, mat===m && s.sfBtnActive]} onPress={() => setMat(m)}>
                <Text style={[s.sfBtnText, mat===m && s.sfBtnTextActive]}>{m==="cu" ? "Copper" : "Aluminum"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[s.input, { marginBottom:10 }]}
            value={q} onChangeText={setQ}
            placeholder="Filter by AWG..." placeholderTextColor={C.muted}
          />

          {/* Header */}
          <View style={{ flexDirection:"row", backgroundColor:"#333", borderRadius:4, padding:6, marginBottom:4 }}>
            {["AWG","60°C","75°C","90°C","Max OC"].map((h, i) => (
              <Text key={h} style={{ flex:i===0?1.2:1, color:C.accent, fontSize:11, fontWeight:"700", textAlign:"center" }}>{h}</Text>
            ))}
          </View>

          {filtered.map(w => {
            const a = mat === "cu" ? w.cu : w.al;
            return (
              <View key={w.awg} style={{ flexDirection:"row", paddingVertical:6, borderBottomWidth:1, borderBottomColor:"#2a2a2a" }}>
                <Text style={{ flex:1.2, color:C.accent, fontSize:12, textAlign:"center", fontWeight:"700" }}>{w.awg}</Text>
                {a.map((v, i) => (
                  <Text key={i} style={{ flex:1, color:v==="-" ? "#555" : C.text, fontSize:12, textAlign:"center" }}>{v}</Text>
                ))}
                <Text style={{ flex:1, color:C.accent, fontSize:12, textAlign:"center", fontWeight:"700" }}>{w.oc}A</Text>
              </View>
            );
          })}

          <Text style={s.infoText}>
            3 or fewer CCC in raceway, 30°C ambient, THHN/THWN.{"\n"}
            Max OC = max overcurrent protection per 240.4.{"\n"}
            Al not permitted for 14 AWG per NEC.
          </Text>
        </View>
      )}

      {/* ── Derating Calculator ── */}
      {tab === "derate" && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Conductor Derating — 310.15(C)</Text>
          <Text style={[s.infoText, { marginBottom:12 }]}>
            More than 3 current-carrying conductors (CCC) in a raceway or cable requires ampacity derating.
          </Text>

          <Text style={s.label}>Base Ampacity (from Ampacity tab)</Text>
          <TextInput style={s.input} keyboardType="decimal-pad" value={baseAmp} onChangeText={setBaseAmp} placeholder="e.g. 30" placeholderTextColor={C.muted}/>

          <Text style={s.label}>Number of CCC in Raceway</Text>
          <TextInput style={s.input} keyboardType="number-pad" value={cccCount} onChangeText={setCccCount} placeholder="e.g. 6" placeholderTextColor={C.muted}/>

          {deratedAmps !== "" && (
            <View style={s.resultBox}>
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Derated Ampacity</Text>
                <Text style={[s.resultValue, { color: C.accent }]}>{deratedAmps}</Text>
              </View>
            </View>
          )}

          {/* Derating table */}
          <Text style={[s.cardTitle, { marginTop:14 }]}>Derating Factors</Text>
          <View style={{ backgroundColor:"#333", borderRadius:4, padding:6, marginBottom:4, flexDirection:"row" }}>
            <Text style={{ flex:1, color:C.accent, fontSize:11, fontWeight:"700" }}>CCC Count</Text>
            <Text style={{ flex:1, color:C.accent, fontSize:11, fontWeight:"700", textAlign:"right" }}>% of Ampacity</Text>
          </View>
          {DERATE.map(([label, factor]) => (
            <View key={label} style={{ flexDirection:"row", paddingVertical:6, borderBottomWidth:1, borderBottomColor:"#2a2a2a" }}>
              <Text style={{ flex:1, color:C.text, fontSize:13 }}>{label}</Text>
              <Text style={{ flex:1, color:C.accent, fontSize:13, fontWeight:"700", textAlign:"right" }}>{(factor*100).toFixed(0)}%</Text>
            </View>
          ))}
          <Text style={s.infoText}>Neutral conductors carrying only unbalanced current of a 3-wire system do not count as CCC.</Text>
        </View>
      )}

      {/* ── Temperature Correction ── */}
      {tab === "temp" && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Temperature Correction — 310.15(B)(2)</Text>
          <Text style={[s.infoText, { marginBottom:12 }]}>
            Ampacity must be corrected when ambient temperature differs from 30°C (86°F).
          </Text>

          <Text style={s.label}>Base Ampacity (from Ampacity tab)</Text>
          <TextInput style={s.input} keyboardType="decimal-pad" value={baseAmp} onChangeText={setBaseAmp} placeholder="e.g. 30" placeholderTextColor={C.muted}/>

          <Text style={s.label}>Conductor Temperature Rating</Text>
          <View style={[s.selectRow, { marginBottom:10 }]}>
            {["60°C","75°C","90°C"].map((t, i) => (
              <TouchableOpacity key={t} style={[s.sfBtn, colIdx===i && s.sfBtnActive]} onPress={() => setColIdx(i)}>
                <Text style={[s.sfBtnText, colIdx===i && s.sfBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Ambient Temperature</Text>
          <View style={s.selectRow}>
            {TEMP_CORRECTION.map((row, i) => (
              <TouchableOpacity key={row[0]} style={[s.sfBtn, tempIdx===i && s.sfBtnActive]} onPress={() => setTempIdx(i)}>
                <Text style={[s.sfBtnText, { fontSize:10 }, tempIdx===i && s.sfBtnTextActive]}>{row[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {correctedAmps !== "" && (
            <View style={s.resultBox}>
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Correction Factor</Text>
                <Text style={s.resultValue}>{correctionFactor.toFixed(2)}</Text>
              </View>
              <View style={[s.resultRow, { borderBottomWidth:0 }]}>
                <Text style={s.resultLabel}>Corrected Ampacity</Text>
                <Text style={[s.resultValue, { color:C.accent }]}>{correctedAmps}</Text>
              </View>
            </View>
          )}

          <Text style={s.infoText}>
            Both derating (CCC count) and temperature correction may apply simultaneously.{"\n"}
            Apply both factors: Final = Base × Temp Factor × CCC Factor.
          </Text>
        </View>
      )}

    </ScrollView>
  );
}

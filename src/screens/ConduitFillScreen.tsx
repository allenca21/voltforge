import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

// NEC Chapter 9 Table 4 — internal areas (sq in), extended to 6"
const conduitAreas: Record<string, Record<string,number>> = {
  emt:   {"0.5":0.304,"0.75":0.533,"1":0.864,"1.25":1.496,"1.5":2.036,"2":3.356,"2.5":5.858,"3":8.846,"3.5":11.545,"4":14.753},
  imc:   {"0.5":0.342,"0.75":0.586,"1":0.959,"1.25":1.647,"1.5":2.225,"2":3.630,"2.5":5.135,"3":7.922,"3.5":10.584,"4":13.631},
  rmc:   {"0.5":0.314,"0.75":0.549,"1":0.887,"1.25":1.526,"1.5":2.071,"2":3.408,"2.5":4.866,"3":7.499,"3.5":10.010,"4":12.882},
  pvc40: {"0.5":0.285,"0.75":0.508,"1":0.832,"1.25":1.453,"1.5":1.986,"2":3.291,"2.5":4.695,"3":7.268,"3.5":9.737,"4":12.554},
  pvc80: {"0.5":0.217,"0.75":0.401,"1":0.664,"1.25":1.169,"1.5":1.604,"2":2.684,"2.5":3.882,"3":6.101,"3.5":8.316,"4":10.817},
  hdpe:  {"0.5":0.307,"0.75":0.541,"1":0.873,"1.25":1.507,"1.5":2.047,"2":3.408,"2.5":4.866,"3":7.499,"3.5":10.010,"4":12.882},
  lfmc:  {"0.5":0.268,"0.75":0.493,"1":0.804,"1.25":1.388,"1.5":1.903,"2":3.197,"2.5":4.503,"3":6.984,"3.5":9.354,"4":12.062},
};

// NEC Chapter 9 Table 5 — conductor areas by insulation type (sq in)
const wireAreasByType: Record<string, Record<string,number>> = {
  "THHN/THWN": {
    "14":0.0097,"12":0.0133,"10":0.0211,"8":0.0366,"6":0.0507,
    "4":0.0824,"3":0.0973,"2":0.1158,"1":0.1562,"1/0":0.1855,
    "2/0":0.2223,"3/0":0.2679,"4/0":0.3237,"250":0.3970,"350":0.5460,
    "500":0.7854,"600":0.9503,"750":1.1882,"1000":1.5399,
  },
  "XHHW/XHHW-2": {
    "14":0.0097,"12":0.0133,"10":0.0211,"8":0.0437,"6":0.0590,
    "4":0.0814,"3":0.0962,"2":0.1146,"1":0.1534,"1/0":0.1825,
    "2/0":0.2190,"3/0":0.2642,"4/0":0.3197,"250":0.3904,"350":0.5358,
    "500":0.7542,"600":0.9331,"750":1.1652,"1000":1.5000,
  },
  "RHH/RHW-2": {
    "14":0.0293,"12":0.0353,"10":0.0437,"8":0.0835,"6":0.1041,
    "4":0.1333,"3":0.1521,"2":0.1750,"1":0.2660,"1/0":0.3039,
    "2/0":0.3505,"3/0":0.4072,"4/0":0.4754,"250":0.6291,"350":0.8038,
    "500":1.0386,"600":1.2135,"750":1.4272,"1000":1.7532,
  },
  "THW/THHW": {
    "14":0.0139,"12":0.0181,"10":0.0243,"8":0.0437,"6":0.0590,
    "4":0.0814,"3":0.0962,"2":0.1146,"1":0.1534,"1/0":0.1825,
    "2/0":0.2190,"3/0":0.2642,"4/0":0.3197,"250":0.3904,"350":0.5358,
    "500":0.7542,"600":0.9331,"750":1.1652,"1000":1.5000,
  },
};

// NEC Chapter 9 Table 4 — conduit internal diameters (inches)
const conduitIDs: Record<string, Record<string,number>> = {
  emt:   {"0.5":0.622,"0.75":0.824,"1":1.049,"1.25":1.380,"1.5":1.610,"2":2.067,"2.5":2.731,"3":3.356,"3.5":3.834,"4":4.334},
  imc:   {"0.5":0.660,"0.75":0.864,"1":1.105,"1.25":1.448,"1.5":1.683,"2":2.150,"2.5":2.557,"3":3.176,"3.5":3.671,"4":4.166},
  rmc:   {"0.5":0.632,"0.75":0.836,"1":1.063,"1.25":1.394,"1.5":1.624,"2":2.083,"2.5":2.489,"3":3.090,"3.5":3.570,"4":4.050},
  pvc40: {"0.5":0.602,"0.75":0.804,"1":1.029,"1.25":1.360,"1.5":1.590,"2":2.047,"2.5":2.445,"3":3.042,"3.5":3.521,"4":3.998},
  pvc80: {"0.5":0.526,"0.75":0.715,"1":0.920,"1.25":1.255,"1.5":1.476,"2":1.913,"2.5":2.290,"3":2.864,"3.5":3.326,"4":3.786},
  hdpe:  {"0.5":0.625,"0.75":0.831,"1":1.055,"1.25":1.385,"1.5":1.615,"2":2.067,"2.5":2.489,"3":3.090,"3.5":3.570,"4":4.050},
  lfmc:  {"0.5":0.584,"0.75":0.788,"1":1.010,"1.25":1.330,"1.5":1.556,"2":2.016,"2.5":2.390,"3":2.981,"3.5":3.450,"4":3.922},
};

// THHN/THWN conductor outside diameters (inches) — NEC Chapter 9 Table 5
const conductorOD: Record<string,number> = {
  "14":0.111,"12":0.130,"10":0.164,"8":0.216,"6":0.254,
  "4":0.324,"3":0.352,"2":0.384,"1":0.446,"1/0":0.486,
  "2/0":0.532,"3/0":0.584,"4/0":0.642,"250":0.711,"350":0.845,
  "500":1.000,"600":1.100,"750":1.230,"1000":1.400,
};

const SIZE_LABELS: Record<string,string> = {
  "0.5":'½"',"0.75":'¾"',"1":'1"',"1.25":'1¼"',"1.5":'1½"',
  "2":'2"',"2.5":'2½"',"3":'3"',"3.5":'3½"',"4":'4"',
};

const CONDUIT_TYPES = [
  ["emt","EMT"],["imc","IMC"],["rmc","RMC"],
  ["pvc40","PVC 40"],["pvc80","PVC 80"],["hdpe","HDPE"],["lfmc","LFMC"],
];

type Wire = { insulation: string; awg: string; qty: string };

// NEC 310.15(C) derating table for current-carrying conductors in a raceway
function getDeratingFactor(count: number): number {
  if (count <= 3)  return 1.00;
  if (count <= 6)  return 0.80;
  if (count <= 9)  return 0.70;
  if (count <= 20) return 0.50;
  if (count <= 30) return 0.45;
  if (count <= 40) return 0.40;
  return 0.35;
}

function ConduitFillInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);
  const [cType, setCType]     = useState("emt");
  const [cSize, setCSize]     = useState("1");
  const [isNipple, setIsNipple] = useState(false);
  const [wires, setWires]     = useState<Wire[]>([
    { insulation:"THHN/THWN", awg:"12", qty:"3" }
  ]);

  const insulationTypes = Object.keys(wireAreasByType);
  const availableSizes  = Object.keys(SIZE_LABELS).filter(sz => conduitAreas[cType]?.[sz] !== undefined);

  const totalArea   = conduitAreas[cType]?.[cSize] ?? 0;
  const fillLimit   = isNipple ? 0.60 : (wires.length === 1 ? 0.53 : wires.length === 2 ? 0.31 : 0.40);
  const allowedArea = totalArea * fillLimit;
  const usedArea    = wires.reduce((acc, w) => {
    const area = wireAreasByType[w.insulation]?.[w.awg] ?? 0;
    return acc + area * (parseInt(w.qty) || 0);
  }, 0);
  const pct       = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
  const limitPct  = fillLimit * 100;
  const barColor  = pct <= limitPct * 0.75 ? C.pass : pct <= limitPct ? C.warn : C.fail;
  const barWidth  = Math.min(pct, 100);

  // Derating
  const totalConductors = wires.reduce((acc, w) => acc + (parseInt(w.qty) || 0), 0);
  const deratingFactor  = getDeratingFactor(totalConductors);
  const needsDerating   = totalConductors > 3;

  // Jam ratio — only meaningful for exactly 3 conductors of same size
  const conduitID = conduitIDs[cType]?.[cSize] ?? 0;
  let jamRatio: number | null = null;
  let jamStatus: "safe"|"risk"|"jam"|null = null;
  if (totalConductors >= 3 && conduitID > 0) {
    // Use the largest conductor OD in the run
    const largestOD = wires.reduce((max, w) => {
      const od = conductorOD[w.awg] ?? 0;
      return od > max ? od : max;
    }, 0);
    if (largestOD > 0) {
      jamRatio = 1.05 * (conduitID / largestOD);
      if (jamRatio < 2.8)       jamStatus = "safe"; // too tight, won't jam but may not fit
      else if (jamRatio <= 3.2) jamStatus = "jam";  // jam zone
      else                      jamStatus = "safe"; // wide enough, no jam risk
    }
  }
  
  const updateWire = (i: number, key: keyof Wire, val: string) => {
    const next = [...wires];
    next[i] = { ...next[i], [key]: val };
    setWires(next);
  };

  const addWire = () => setWires([...wires, { insulation:"THHN/THWN", awg:"12", qty:"1" }]);
  const removeWire = (i: number) => setWires(wires.filter((_, j) => j !== i));

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* ── Conduit Type ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Conduit Type</Text>
        <View style={s.selectRow}>
          {CONDUIT_TYPES.map(([v, l]) => (
            <TouchableOpacity
              key={v}
              style={[s.sfBtn, cType === v && s.sfBtnActive]}
              onPress={() => { setCType(v); if (!conduitAreas[v]?.[cSize]) setCSize("1"); }}
            >
              <Text style={[s.sfBtnText, cType === v && s.sfBtnTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.cardTitle}>Trade Size</Text>
        <View style={s.selectRow}>
          {availableSizes.map(sz => (
            <TouchableOpacity
              key={sz}
              style={[s.sfBtn, cSize === sz && s.sfBtnActive]}
              onPress={() => setCSize(sz)}
            >
              <Text style={[s.sfBtnText, cSize === sz && s.sfBtnTextActive]}>{SIZE_LABELS[sz]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nipple toggle */}
        <TouchableOpacity
          style={{
            flexDirection:"row", alignItems:"center", marginTop:8,
            backgroundColor: isNipple ? C.accent : C.input,
            borderRadius:6, padding:10, borderWidth:1,
            borderColor: isNipple ? C.accent : "#444",
          }}
          onPress={() => setIsNipple(!isNipple)}
        >
          <Text style={{ fontSize:13, fontWeight:"700", color: isNipple ? "#111" : C.muted, flex:1 }}>
            {isNipple ? "✔  Nipple Mode (≤24\" — 60% fill)" : "Nipple ≤24\"? (tap to enable 60% fill)"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Conductors ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Conductors</Text>

        {wires.map((w, i) => (
          <View key={i} style={{ marginBottom:16, borderBottomWidth:1, borderBottomColor:C.border, paddingBottom:14 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <Text style={[s.label, { marginBottom:0 }]}>Conductor {i + 1}</Text>
              {wires.length > 1 && (
                <TouchableOpacity style={s.rmBtn} onPress={() => removeWire(i)}>
                  <Text style={s.rmText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Insulation type */}
            <Text style={s.label}>Insulation Type</Text>
            <View style={[s.selectRow, { marginBottom:10 }]}>
              {insulationTypes.map(ins => (
                <TouchableOpacity
                  key={ins}
                  style={[s.sfBtn, w.insulation === ins && s.sfBtnActive]}
                  onPress={() => updateWire(i, "insulation", ins)}
                >
                  <Text style={[s.sfBtnText, { fontSize:10 }, w.insulation === ins && s.sfBtnTextActive]}>
                    {ins}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AWG size */}
            <Text style={s.label}>AWG / kcmil Size</Text>
            <View style={[s.selectRow, { marginBottom:10 }]}>
              {Object.keys(wireAreasByType[w.insulation] || wireAreasByType["THHN/THWN"]).map(a => (
                <TouchableOpacity
                  key={a}
                  onPress={() => updateWire(i, "awg", a)}
                  style={{
                    paddingHorizontal:8, paddingVertical:6, borderRadius:4, marginBottom:4,
                    backgroundColor: w.awg === a ? C.accent : C.input,
                  }}
                >
                  <Text style={{ fontSize:11, color: w.awg === a ? "#111" : C.muted }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity */}
            <Text style={s.label}>Quantity</Text>
            <TextInput
              style={[s.input, { width:80 }]}
              keyboardType="number-pad"
              value={w.qty}
              onChangeText={v => updateWire(i, "qty", v)}
            />
          </View>
        ))}

        <TouchableOpacity style={[s.btn, s.btnOutline, { marginBottom:14 }]} onPress={addWire}>
          <Text style={s.btnOutlineText}>+ Add Conductor Group</Text>
        </TouchableOpacity>

        {/* ── Results ── */}
        <View style={s.resultBox}>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Conduit Internal Area</Text>
            <Text style={s.resultValue}>{totalArea.toFixed(4)} sq in</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Fill Limit ({limitPct.toFixed(0)}%){isNipple ? " — Nipple" : wires.length === 1 ? " — 1 wire" : wires.length === 2 ? " — 2 wires" : " — 3+ wires"}</Text>
            <Text style={s.resultValue}>{allowedArea.toFixed(4)} sq in</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Used Area</Text>
            <Text style={[s.resultValue, { color: barColor }]}>{usedArea.toFixed(4)} sq in</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Fill Percentage</Text>
            <Text style={[s.resultValue, { color: barColor }]}>{pct.toFixed(1)}%</Text>
          </View>

          {/* Fill bar */}
          <View style={s.fillBarBg}>
            <View style={[s.fillBar, { width:`${barWidth}%`, backgroundColor:barColor }]}>
              {barWidth > 15 && <Text style={s.fillBarText}>{pct.toFixed(0)}%</Text>}
            </View>
          </View>

          <View style={[s.resultRow, { borderBottomWidth:0 }]}>
            <Text style={s.resultLabel}>Status</Text>
            <Text style={[s.resultValue, { color: pct <= limitPct ? C.pass : C.fail }]}>
              {pct <= limitPct ? `✔ PASS — within ${limitPct.toFixed(0)}%` : `✘ FAIL — exceeds ${limitPct.toFixed(0)}% limit`}
            </Text>
          </View>
        </View>

        {/* ── Derating Warning ── */}
        {needsDerating && (
          <View style={{
            backgroundColor: C.input, borderWidth:1, borderColor:C.warn,
            borderRadius:6, padding:12, marginTop:10,
          }}>
            <Text style={{ color:C.warn, fontWeight:"700", fontSize:13, marginBottom:4 }}>
              ⚠  Ampacity Derating Required — 310.15(C)
            </Text>
            <Text style={{ color:"#ccc", fontSize:12, lineHeight:18 }}>
              {totalConductors} current-carrying conductors in raceway.{"\n"}
              Derate ampacity to <Text style={{ color:C.warn, fontWeight:"700" }}>{(deratingFactor * 100).toFixed(0)}%</Text> of Table 310.15(B) values.
            </Text>
            <View style={{ marginTop:8, borderTopWidth:1, borderTopColor:"#3a2a00", paddingTop:8 }}>
              <Text style={{ color:"#aaa", fontSize:11, lineHeight:17 }}>
                4–6 conductors: 80%  |  7–9: 70%  |  10–20: 50%{"\n"}
                21–30: 45%  |  31–40: 40%  |  41+: 35%
              </Text>
            </View>
          </View>
        )}

        {/* ── Jam Ratio ── */}
        {jamRatio !== null && (
          <View style={{
            backgroundColor: C.input,
            borderWidth:1,
            borderColor: jamStatus === "jam" ? C.fail : C.pass,
            borderRadius:6, padding:12, marginTop:10,
          }}>
            <Text style={{ color: jamStatus === "jam" ? C.fail : C.pass, fontWeight:"700", fontSize:13, marginBottom:4 }}>
              {jamStatus === "jam" ? "⚠  Jam Risk — NEC Ch.9 Note 2" : "✔  Jam Ratio — OK"}
            </Text>
            <Text style={{ color:"#ccc", fontSize:12, lineHeight:18 }}>
              Jam ratio: <Text style={{ fontWeight:"700", color: jamStatus === "jam" ? C.fail : C.pass }}>{jamRatio.toFixed(2)}</Text>
              {jamStatus === "jam"
                ? "  — ratio between 2.8–3.2, jamming can occur at bends"
                : jamRatio < 2.8
                ? "  — ratio below 2.8, conduit may be too tight to pull"
                : "  — ratio above 3.2, low jam probability"}
            </Text>
            <Text style={{ color:"#aaa", fontSize:11, marginTop:6, lineHeight:17 }}>
              Formula: 1.05 × (conduit ID ÷ conductor OD){"\n"}
              Jam zone: 2.8–3.2  |  Safe: {"<"}2.8 or {">"}3.2
            </Text>
          </View>
        )}

        <Text style={s.infoText}>
          Fill limits per NEC Ch.9 Table 1: 1 wire=53%, 2 wires=31%, 3+=40%, nipple=60%.{"\n"}
          Wire areas from Table 5. Derating per 310.15(C) for 4+ CCC in raceway.{"\n"}
          Jam ratio per NEC Ch.9 Informational Note 2.
        </Text>
      </View>

    </ScrollView>
  );
}

export function ConduitFillScreen() {
  return <ProGate feature="Conduit Fill Calculator"><ConduitFillInner/></ProGate>;
}

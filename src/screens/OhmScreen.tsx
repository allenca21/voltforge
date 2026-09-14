import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";

type Phase = "1ph" | "3ph";

const AWG_OPTIONS: Array<[string, number, number]> = [
  ["14",12.9,21.2],["12",8.14,13.3],["10",5.13,8.37],
  ["8",3.23,5.28],["6",2.03,3.31],["4",1.28,2.09],
  ["2",0.808,1.32],["1",0.641,1.05],["1/0",0.508,0.829],
  ["2/0",0.403,0.659],["3/0",0.319,0.523],["4/0",0.253,0.414],
  ["250",0.215,0.353],["350",0.154,0.252],["500",0.108,0.176],
];
const VOLTAGES = ["120","208","240","277","480","600"];

export function OhmScreen() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);

  const [V,setV]=useState(""); const [I,setI]=useState("");
  const [R,setR]=useState(""); const [P,setP]=useState("");
  const [vdI,setVdI]=useState(""); const [vdL,setVdL]=useState("");
  const [vdAWG,setVdAWG]=useState("12"); const [vdSV,setVdSV]=useState("120");
  const [vdMat,setVdMat]=useState<"cu"|"al">("cu");
  const [vdPh,setVdPh]=useState<Phase>("1ph");
  const [tpV,setTpV]=useState(""); const [tpI,setTpI]=useState("");
  const [tpPF,setTpPF]=useState("0.9"); const [tpKW,setTpKW]=useState("");

  let res: Record<string,string> = {};
  const nums=[parseFloat(V),parseFloat(I),parseFloat(R),parseFloat(P)];
  if(nums.filter(n=>!isNaN(n)).length>=2){
    let[rV,rI,rR,rP]=nums;
    if(!isNaN(rV)&&!isNaN(rI)){rR=rV/rI;rP=rV*rI;}
    else if(!isNaN(rV)&&!isNaN(rR)){rI=rV/rR;rP=rV*rV/rR;}
    else if(!isNaN(rV)&&!isNaN(rP)){rI=rP/rV;rR=rV*rV/rP;}
    else if(!isNaN(rI)&&!isNaN(rR)){rV=rI*rR;rP=rI*rI*rR;}
    else if(!isNaN(rI)&&!isNaN(rP)){rV=rP/rI;rR=rP/(rI*rI);}
    else if(!isNaN(rR)&&!isNaN(rP)){rV=Math.sqrt(rP*rR);rI=Math.sqrt(rP/rR);}
    res={"Voltage (V)":rV.toFixed(2)+" V","Current (I)":rI.toFixed(3)+" A",
      "Resistance (R)":rR.toFixed(3)+" Ω","Power (P)":rP.toFixed(2)+" W  ("+(rP/1000).toFixed(3)+" kW)"};
  }

  let vdRes: Array<{label:string;val:string;cls?:"pass"|"warn"|"fail"}>=[];
  const vdIf=parseFloat(vdI),vdLf=parseFloat(vdL),vdSVf=parseFloat(vdSV);
  const vdReady=!isNaN(vdIf)&&!isNaN(vdLf)&&vdIf>0&&vdLf>0;
  if(vdReady){
    const awgRow=AWG_OPTIONS.find(r=>r[0]===vdAWG)??AWG_OPTIONS[1];
    const ohms=vdMat==="cu"?awgRow[1]:awgRow[2];
    const mult=vdPh==="3ph"?1.732:2;
    const vd=(mult*ohms*vdIf*vdLf)/1000;
    const pct=(vd/vdSVf)*100;
    const cls=pct<=3?"pass":pct<=5?"warn":"fail";
    const maxVD3=vdSVf*0.03;
    const needed=(maxVD3*1000)/(mult*vdIf*vdLf);
    const suggested=[...AWG_OPTIONS].reverse().find(r=>(vdMat==="cu"?r[1]:r[2])<=needed);
    vdRes=[
      {label:"Voltage Drop",val:vd.toFixed(2)+" V"},
      {label:"% of System Voltage",val:`${pct.toFixed(2)}%  ${pct<=3?"✔ OK":pct<=5?"⚠ Marginal":"✘ OVER"}`,cls},
      {label:"Receiving End Voltage",val:(vdSVf-vd).toFixed(1)+" V"},
      {label:"3% Max Allowed Drop",val:maxVD3.toFixed(2)+" V"},
    ];
    if(pct>3&&suggested) vdRes.push({label:"Min AWG for 3%",val:suggested[0]+" AWG "+(vdMat==="cu"?"Cu":"Al"),cls:"warn"});
  }

  let tpRes: Array<{label:string;val:string}>=[];
  const tpVf=parseFloat(tpV),tpIf=parseFloat(tpI),tpPFf=parseFloat(tpPF),tpKWf=parseFloat(tpKW);
  if(!isNaN(tpVf)&&tpVf>0&&!isNaN(tpPFf)&&tpPFf>0){
    if(!isNaN(tpIf)&&tpIf>0){
      const kva=(tpVf*tpIf*1.732)/1000,kw=kva*tpPFf,kvar=Math.sqrt(Math.max(0,kva*kva-kw*kw));
      tpRes=[{label:"Apparent Power (kVA)",val:kva.toFixed(2)+" kVA"},{label:"Real Power (kW)",val:kw.toFixed(2)+" kW"},
        {label:"Reactive Power (kVAR)",val:kvar.toFixed(2)+" kVAR"},{label:"HP Equivalent",val:(kw*1.341).toFixed(2)+" HP"}];
    } else if(!isNaN(tpKWf)&&tpKWf>0){
      const kva=tpKWf/tpPFf,amps=(kva*1000)/(tpVf*1.732),kvar=Math.sqrt(Math.max(0,kva*kva-tpKWf*tpKWf));
      tpRes=[{label:"Apparent Power (kVA)",val:kva.toFixed(2)+" kVA"},{label:"Current (A)",val:amps.toFixed(2)+" A"},
        {label:"Reactive Power (kVAR)",val:kvar.toFixed(2)+" kVAR"},{label:"HP Equivalent",val:(tpKWf*1.341).toFixed(2)+" HP"}];
    }
  }

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.cardTitle}>Ohm's Law — Enter Any 2 Values</Text>
        <View style={s.row}>
          <View style={s.flex1}><Text style={s.label}>Voltage (V)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={V} onChangeText={setV} placeholder="—" placeholderTextColor={C.muted}/></View>
          <View style={s.flex1}><Text style={s.label}>Current (A)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={I} onChangeText={setI} placeholder="—" placeholderTextColor={C.muted}/></View>
        </View>
        <View style={s.row}>
          <View style={s.flex1}><Text style={s.label}>Resistance (Ω)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={R} onChangeText={setR} placeholder="—" placeholderTextColor={C.muted}/></View>
          <View style={s.flex1}><Text style={s.label}>Power (W)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={P} onChangeText={setP} placeholder="—" placeholderTextColor={C.muted}/></View>
        </View>
        {Object.keys(res).length>0&&<View style={s.resultBox}>
          {Object.entries(res).map(([k,v])=><View key={k} style={s.resultRow}>
            <Text style={s.resultLabel}>{k}</Text><Text style={s.resultValue}>{v}</Text></View>)}
        </View>}
        <TouchableOpacity style={[s.btn,s.btnOutline,{marginTop:10}]} onPress={()=>{setV("");setI("");setR("");setP("");}}>
          <Text style={s.btnOutlineText}>Clear</Text></TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Voltage Drop Calculator</Text>
        <View style={s.row}>
          <View style={s.flex1}><Text style={s.label}>Phase</Text>
            <View style={s.selectRow}>
              {(["1ph","3ph"] as Phase[]).map(p=>(
                <TouchableOpacity key={p} style={[s.sfBtn,{flex:1},vdPh===p&&s.sfBtnActive]} onPress={()=>setVdPh(p)}>
                  <Text style={[s.sfBtnText,vdPh===p&&s.sfBtnTextActive]}>{p==="1ph"?"1-Phase":"3-Phase"}</Text></TouchableOpacity>
              ))}</View></View>
          <View style={s.flex1}><Text style={s.label}>Material</Text>
            <View style={s.selectRow}>
              {(["cu","al"] as const).map(m=>(
                <TouchableOpacity key={m} style={[s.sfBtn,{flex:1},vdMat===m&&s.sfBtnActive]} onPress={()=>setVdMat(m)}>
                  <Text style={[s.sfBtnText,vdMat===m&&s.sfBtnTextActive]}>{m==="cu"?"Copper":"Alum"}</Text></TouchableOpacity>
              ))}</View></View>
        </View>
        <View style={s.row}>
          <View style={s.flex1}><Text style={s.label}>Load (A)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={vdI} onChangeText={setVdI} placeholder="20" placeholderTextColor={C.muted}/></View>
          <View style={s.flex1}><Text style={s.label}>One-Way Length (ft)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={vdL} onChangeText={setVdL} placeholder="100" placeholderTextColor={C.muted}/></View>
        </View>
        <Text style={s.label}>System Voltage</Text>
        <View style={[s.selectRow,{marginBottom:12}]}>
          {VOLTAGES.map(v=><TouchableOpacity key={v} style={[s.sfBtn,vdSV===v&&s.sfBtnActive]} onPress={()=>setVdSV(v)}>
            <Text style={[s.sfBtnText,vdSV===v&&s.sfBtnTextActive]}>{v}V</Text></TouchableOpacity>)}
        </View>
        <Text style={s.label}>Wire Size — selected: <Text style={{color:C.accent,fontWeight:"700"}}>{vdAWG} AWG</Text></Text>
        <View style={[s.selectRow,{marginBottom:12}]}>
          {AWG_OPTIONS.map(([l])=><TouchableOpacity key={l} style={[s.sfBtn,{minWidth:44},vdAWG===l&&s.sfBtnActive]} onPress={()=>setVdAWG(l)}>
            <Text style={[s.sfBtnText,{fontSize:10},vdAWG===l&&s.sfBtnTextActive]}>{l}</Text></TouchableOpacity>)}
        </View>
        {vdReady?(
          <View style={s.resultBox}>
            {vdRes.map(({label,val,cls})=><View key={label} style={s.resultRow}>
              <Text style={s.resultLabel}>{label}</Text>
              <Text style={[s.resultValue,cls==="pass"?{color:C.pass}:cls==="warn"?{color:C.warn}:cls==="fail"?{color:C.fail}:{}]}>{val}</Text>
            </View>)}
          </View>
        ):(
          <View style={{backgroundColor:isDark?"#1e1e1e":C.card,borderRadius:6,padding:12,borderWidth:1,borderColor:C.border}}>
            <Text style={{color:C.muted,fontSize:12,textAlign:"center"}}>Enter load (A) and length (ft) to calculate</Text>
          </View>
        )}
        <Text style={[s.infoText,{marginTop:8}]}>NEC recommends ≤3% on branch circuits, ≤5% combined feeder+branch.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>3-Phase Power Calculator</Text>
        <View style={{backgroundColor:isDark?"#1e1e1e":C.card,borderRadius:6,padding:10,marginBottom:12,borderWidth:1,borderColor:C.border}}>
          <Text style={{color:C.muted,fontSize:12,lineHeight:18}}>
            <Text style={{color:C.accent,fontWeight:"700"}}>Option A:</Text> Enter Voltage + Current + PF{"\n"}
            <Text style={{color:C.accent,fontWeight:"700"}}>Option B:</Text> Enter Voltage + kW + PF
          </Text>
        </View>
        <View style={s.row}>
          <View style={s.flex1}><Text style={s.label}>Line Voltage (V)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={tpV} onChangeText={setTpV} placeholder="480" placeholderTextColor={C.muted}/></View>
          <View style={s.flex1}><Text style={s.label}>Power Factor (0–1)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={tpPF} onChangeText={setTpPF} placeholder="0.9" placeholderTextColor={C.muted}/></View>
        </View>
        <View style={s.row}>
          <View style={s.flex1}><Text style={s.label}>Current (A) — Option A</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={tpI} onChangeText={v=>{setTpI(v);if(v)setTpKW("");}} placeholder="—" placeholderTextColor={C.muted}/></View>
          <View style={s.flex1}><Text style={s.label}>Real Power kW — Option B</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={tpKW} onChangeText={v=>{setTpKW(v);if(v)setTpI("");}} placeholder="—" placeholderTextColor={C.muted}/></View>
        </View>
        {tpRes.length>0?(
          <View style={s.resultBox}>
            {tpRes.map(({label,val})=><View key={label} style={s.resultRow}>
              <Text style={s.resultLabel}>{label}</Text><Text style={s.resultValue}>{val}</Text></View>)}
          </View>
        ):(
          <View style={{backgroundColor:isDark?"#1e1e1e":C.card,borderRadius:6,padding:12,borderWidth:1,borderColor:C.border}}>
            <Text style={{color:C.muted,fontSize:12,textAlign:"center"}}>Enter Voltage + PF + (Amps or kW) to calculate</Text>
          </View>
        )}
        <TouchableOpacity style={[s.btn,s.btnOutline,{marginTop:10}]} onPress={()=>{setTpV("");setTpI("");setTpKW("");setTpPF("0.9");}}>
          <Text style={s.btnOutlineText}>Clear</Text></TouchableOpacity>
        <Text style={[s.infoText,{marginTop:8}]}>Formula: kVA = (V × A × 1.732) / 1000  •  kW = kVA × PF</Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(C: typeof DARK) {
  return {
    scroll:         { flex:1, backgroundColor:C.bg, padding:14 } as const,
    card:           { backgroundColor:C.card, borderRadius:8, borderWidth:1, borderColor:C.border, padding:14, marginBottom:12 } as const,
    cardTitle:      { fontSize:11, fontWeight:"700" as const, color:C.accent, letterSpacing:0.8, textTransform:"uppercase" as const, marginBottom:10 },
    label:          { fontSize:12, color:C.muted, marginBottom:4 },
    input:          { backgroundColor:C.input, borderWidth:1, borderColor:C.border, borderRadius:5, color:C.text, padding:9, fontSize:14, marginBottom:10 },
    row:            { flexDirection:"row" as const, gap:10 },
    flex1:          { flex:1 },
    btn:            { backgroundColor:C.accent, borderRadius:5, padding:11, alignItems:"center" as const, marginTop:4 },
    btnText:        { color:"#111", fontWeight:"700" as const, fontSize:13 },
    btnOutline:     { backgroundColor:"transparent", borderWidth:1, borderColor:C.accent },
    btnOutlineText: { color:C.accent, fontWeight:"700" as const, fontSize:13 },
    resultBox:      { backgroundColor:C.input, borderWidth:1, borderColor:C.accent, borderRadius:6, padding:12, marginTop:10 },
    resultRow:      { flexDirection:"row" as const, justifyContent:"space-between" as const, paddingVertical:4, borderBottomWidth:1, borderBottomColor:C.border },
    resultLabel:    { color:C.muted, fontSize:13 },
    resultValue:    { color:C.accent, fontWeight:"700" as const, fontSize:13 },
    infoText:       { fontSize:11, color:C.muted, marginTop:6, lineHeight:17 },
    selectRow:      { flexDirection:"row" as const, flexWrap:"wrap" as const, gap:6, marginBottom:10 },
    sfBtn:          { flex:1, minWidth:60, backgroundColor:C.input, borderWidth:1, borderColor:C.border, borderRadius:5, padding:8, alignItems:"center" as const },
    sfBtnActive:    { backgroundColor:C.accent, borderColor:C.accent },
    sfBtnText:      { color:C.muted, fontSize:12, fontWeight:"600" as const },
    sfBtnTextActive:{ color:"#111" },
  };
}

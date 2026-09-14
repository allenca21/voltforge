import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";

type Frac = { whole:number; num:number; den:number };
const EMPTY: Frac = { whole:0, num:0, den:16 };
const DENOMS = [2,4,8,16,32,64];

function gcd(a:number,b:number):number { return b===0?a:gcd(b,a%b); }
function simplify(num:number,den:number){ const g=gcd(Math.abs(num),den); return {num:num/g,den:den/g}; }
function toDecimal(v:Frac){ return v.whole + v.num/v.den; }

function toFrac(decimal:number): Frac {
  const whole=Math.floor(Math.abs(decimal));
  const rem=Math.abs(decimal)-whole;
  const den=64;
  const num=Math.round(rem*den);
  const s=simplify(num,den);
  return { whole:decimal<0?-whole:whole, num:decimal<0?-s.num:s.num, den:s.den };
}

const fracAdd=(a:Frac,b:Frac)=>toFrac(toDecimal(a)+toDecimal(b));
const fracSub=(a:Frac,b:Frac)=>toFrac(toDecimal(a)-toDecimal(b));
const fracMul=(a:Frac,b:Frac)=>toFrac(toDecimal(a)*toDecimal(b));
const fracDiv=(a:Frac,b:Frac)=>toDecimal(b)===0?EMPTY:toFrac(toDecimal(a)/toDecimal(b));

function display(v:Frac): string {
  if(v.num===0) return `${v.whole}"`;
  if(v.whole===0) return `${v.num}/${v.den}"`;
  return `${v.whole} ${v.num}/${v.den}"`;
}

export function FractionScreen() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;

  const [valA,setValA]=useState<Frac>(EMPTY);
  const [valB,setValB]=useState<Frac>(EMPTY);
  const [active,setActive]=useState<"A"|"B">("A");
  const [op,setOp]=useState<"+"|"-"|"×"|"÷">("+");
  const [result,setResult]=useState<Frac|null>(null);
  const [wholeStr,setWholeStr]=useState("0");

  const current=active==="A"?valA:valB;
  const setCurrent=(v:Frac)=>{ if(active==="A") setValA(v); else setValB(v); };
  const [showHelp, setShowHelp] = useState(false);

  const tapNum=(n:number)=>{
    const ns=wholeStr==="0"?String(n):wholeStr+n;
    setWholeStr(ns); setCurrent({...current,whole:parseInt(ns)}); setResult(null);
  };
  const tapFrac=(num:number,den:number)=>{ setCurrent({...current,num,den}); setResult(null); };
  const tapClear=()=>{ setCurrent(EMPTY); setWholeStr("0"); setResult(null); };
  const tapBackspace=()=>{
    const ns=wholeStr.length>1?wholeStr.slice(0,-1):"0";
    setWholeStr(ns); setCurrent({...current,whole:parseInt(ns)});
  };
  const cycleOp=()=>{
    const ops=["+","-","×","÷"] as const;
    setOp(ops[(ops.indexOf(op)+1)%4]); setResult(null);
  };
  const tapEquals=()=>{
    const r=op==="+"?fracAdd(valA,valB):op==="-"?fracSub(valA,valB):op==="×"?fracMul(valA,valB):fracDiv(valA,valB);
    setResult(r);
  };
  const switchSlot=(slot:"A"|"B")=>{
    setActive(slot); setWholeStr(String(slot==="A"?valA.whole:valB.whole)); setResult(null);
  };

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}} keyboardShouldPersistTaps="handled">

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={()=>setShowHelp(false)}>
        <TouchableOpacity style={{flex:1,backgroundColor:"rgba(0,0,0,0.6)",justifyContent:"center",padding:24}} activeOpacity={1} onPress={()=>setShowHelp(false)}>
          <TouchableOpacity activeOpacity={1} style={{backgroundColor:C.card,borderRadius:12,padding:20,borderWidth:1,borderColor:C.border}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <Text style={{fontSize:16,fontWeight:"700",color:C.accent}}>How to Use</Text>
              <TouchableOpacity onPress={()=>setShowHelp(false)}>
                <Text style={{fontSize:20,color:C.muted}}>✕</Text>
              </TouchableOpacity>
            </View>
            {[
              ["1","Tap A or B to select which slot you're editing — the active slot has a gold border."],
              ["2","Use the number pad to enter whole inches for the selected slot."],
              ["3","Tap a fraction button below to set the fraction (e.g. 3/8)."],
              ["4","Tap the operator button (+ − × ÷) between the slots to change the operation."],
              ["5","Tap = Calculate to see the result in both fraction and decimal form."],
              ["6","Tap CLR to clear the current slot, or tap ⌫ to delete the last digit."],
            ].map(([num,text])=>(
              <View key={num} style={{flexDirection:"row",marginBottom:12}}>
                <View style={{backgroundColor:C.accent,borderRadius:10,width:22,height:22,alignItems:"center",justifyContent:"center",marginRight:10,marginTop:1}}>
                  <Text style={{color:"#111",fontSize:11,fontWeight:"700"}}>{num}</Text>
                </View>
                <Text style={{color:C.text,fontSize:13,flex:1,lineHeight:20}}>{text}</Text>
              </View>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Display */}
      <View style={{backgroundColor:C.card,margin:14,borderRadius:8,padding:14,borderWidth:1,borderColor:C.border}}>
        <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <Text style={{fontSize:11,fontWeight:"700",color:C.accent,letterSpacing:0.8,textTransform:"uppercase"}}>Fraction Calculator</Text>
          <TouchableOpacity onPress={()=>setShowHelp(true)} style={{backgroundColor:C.input,borderRadius:12,width:24,height:24,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border}}>
            <Text style={{color:C.accent,fontSize:13,fontWeight:"700"}}>?</Text>
          </TouchableOpacity>
        </View>
        <View style={{flexDirection:"row",alignItems:"center",gap:10,marginBottom:8}}>
          <TouchableOpacity style={[{flex:1,backgroundColor:C.input,borderRadius:6,padding:10,alignItems:"center",borderWidth:1,borderColor:C.border},active==="A"&&{borderColor:C.accent,borderWidth:2}]} onPress={()=>switchSlot("A")}>
            <Text style={{fontSize:10,color:C.muted,marginBottom:2}}>A</Text>
            <Text style={{fontSize:20,fontWeight:"700",color:C.text}}>{display(valA)}</Text>
            <Text style={{fontSize:10,color:C.muted,marginTop:2}}>{toDecimal(valA).toFixed(4)}"</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{backgroundColor:C.border,borderRadius:20,width:40,height:40,alignItems:"center",justifyContent:"center"}} onPress={cycleOp}>
            <Text style={{fontSize:20,fontWeight:"700",color:C.accent}}>{op}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[{flex:1,backgroundColor:C.input,borderRadius:6,padding:10,alignItems:"center",borderWidth:1,borderColor:C.border},active==="B"&&{borderColor:C.accent,borderWidth:2}]} onPress={()=>switchSlot("B")}>
            <Text style={{fontSize:10,color:C.muted,marginBottom:2}}>B</Text>
            <Text style={{fontSize:20,fontWeight:"700",color:C.text}}>{display(valB)}</Text>
            <Text style={{fontSize:10,color:C.muted,marginTop:2}}>{toDecimal(valB).toFixed(4)}"</Text>
          </TouchableOpacity>
        </View>
        {result&&(
          <View style={{flexDirection:"row",alignItems:"baseline",borderTopWidth:1,borderTopColor:C.border,paddingTop:10}}>
            <Text style={{fontSize:18,color:C.muted}}>= </Text>
            <Text style={{fontSize:28,fontWeight:"700",color:C.accent}}>{display(result)}</Text>
            <Text style={{fontSize:12,color:C.muted}}>  ({toDecimal(result).toFixed(4)}")</Text>
          </View>
        )}
      </View>

      {/* Number pad */}
      <View style={{marginHorizontal:14,marginBottom:0}}>
        <Text style={{fontSize:10,color:C.muted,letterSpacing:0.8,marginBottom:8,textTransform:"uppercase"}}>WHOLE INCHES — editing {active}</Text>
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,maxWidth:400,alignSelf:"center",width:"100%"}}>
          {[7,8,9,4,5,6,1,2,3].map(n=>(
            <TouchableOpacity key={n} style={{width:"30%",aspectRatio:1.8,backgroundColor:C.card,borderRadius:6,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border}} onPress={()=>tapNum(n)}>
              <Text style={{fontSize:20,fontWeight:"700",color:C.text}}>{n}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{width:"30%",aspectRatio:1.8,backgroundColor:C.card,borderRadius:6,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border}} onPress={()=>tapNum(0)}>
            <Text style={{fontSize:20,fontWeight:"700",color:C.text}}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{width:"30%",aspectRatio:1.8,backgroundColor:C.input,borderRadius:6,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border}} onPress={tapBackspace}>
            <Text style={{fontSize:20,fontWeight:"700",color:C.text}}>⌫</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{width:"30%",aspectRatio:1.8,backgroundColor:C.input,borderRadius:6,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border}} onPress={tapClear}>
            <Text style={{fontSize:20,fontWeight:"700",color:C.fail}}>CLR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculate button */}
      <TouchableOpacity style={{marginHorizontal:14,marginTop:4,marginBottom:24,backgroundColor:C.accent,borderRadius:8,padding:16,alignItems:"center"}} onPress={tapEquals}>
        <Text style={{color:"#111",fontWeight:"700",fontSize:18}}>=  Calculate</Text>
      </TouchableOpacity>

      {/* Fraction picker */}
      <View style={{marginHorizontal:14,marginBottom:12}}>
        <Text style={{fontSize:10,color:C.muted,letterSpacing:0.8,marginBottom:8,textTransform:"uppercase"}}>FRACTION — tap to set for slot {active}</Text>
        {DENOMS.map(den=>(
          <View key={den} style={{flexDirection:"row",flexWrap:"wrap",gap:6,marginBottom:8,alignItems:"center"}}>
            <Text style={{fontSize:12,color:C.muted,width:38}}>/{den}"</Text>
            {Array.from({length:den-1},(_,i)=>i+1).filter(n=>gcd(n,den)===1).map(num=>(
              <TouchableOpacity
                key={num}
                style={[{paddingHorizontal:9,paddingVertical:7,backgroundColor:C.card,borderRadius:5,borderWidth:1,borderColor:C.border},
                  current.num===num&&current.den===den&&{backgroundColor:C.accent}]}
                onPress={()=>tapFrac(num,den)}
              >
                <Text style={[{fontSize:12,color:C.text},current.num===num&&current.den===den&&{color:"#111"}]}>{num}/{den}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <View style={{height:30}}/>
    </ScrollView>
  );
}

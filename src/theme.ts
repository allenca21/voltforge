import { StyleSheet } from "react-native";

// ─── Color palettes ────────────────────────────────────────────
export const DARK = {
  bg:"#1a1a1a", card:"#242424", border:"#333",
  accent:"#f5a623", text:"#e0e0e0", muted:"#888",
  pass:"#4caf50", fail:"#f44336", warn:"#ff9800",
  input:"#111", header:"#111", pro:"#f5a623",
};

export const LIGHT = {
  bg:"#f0f0f0", card:"#ffffff", border:"#ddd",
  accent:"#c47e0a", text:"#1a1a1a", muted:"#777",
  pass:"#2e7d32", fail:"#c62828", warn:"#e65100",
  input:"#ffffff", header:"#ffffff", pro:"#c47e0a",
};

// Default export stays dark for backward compat
export const C = DARK;

export const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:DARK.bg },
  scroll:    { flex:1, backgroundColor:DARK.bg, padding:14 },
  card:      { backgroundColor:DARK.card, borderRadius:8, borderWidth:1, borderColor:DARK.border, padding:14, marginBottom:12 },
  cardTitle: { fontSize:11, fontWeight:"700", color:DARK.accent, letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 },
  label:     { fontSize:12, color:DARK.muted, marginBottom:4 },
  input:     { backgroundColor:DARK.input, borderWidth:1, borderColor:"#444", borderRadius:5, color:DARK.text, padding:9, fontSize:14, marginBottom:10 },
  row:       { flexDirection:"row", gap:10 },
  flex1:     { flex:1 },
  btn:       { backgroundColor:DARK.accent, borderRadius:5, padding:11, alignItems:"center", marginTop:4 },
  btnText:   { color:"#111", fontWeight:"700", fontSize:13 },
  btnOutline:     { backgroundColor:"transparent", borderWidth:1, borderColor:DARK.accent },
  btnOutlineText: { color:DARK.accent, fontWeight:"700", fontSize:13 },
  resultBox:   { backgroundColor:DARK.header, borderWidth:1, borderColor:DARK.accent, borderRadius:6, padding:12, marginTop:10 },
  resultRow:   { flexDirection:"row", justifyContent:"space-between", paddingVertical:4, borderBottomWidth:1, borderBottomColor:"#2a2a2a" },
  resultLabel: { color:DARK.muted, fontSize:13 },
  resultValue: { color:DARK.accent, fontWeight:"700", fontSize:13 },
  infoText:    { fontSize:11, color:"#777", marginTop:6, lineHeight:17 },
  selectRow:   { flexDirection:"row", flexWrap:"wrap", gap:6, marginBottom:10 },
  sfBtn:       { flex:1, minWidth:60, backgroundColor:"#2a2a2a", borderWidth:1, borderColor:"#444", borderRadius:5, padding:8, alignItems:"center" },
  sfBtnActive: { backgroundColor:DARK.accent, borderColor:DARK.accent },
  sfBtnText:   { color:DARK.muted, fontSize:12, fontWeight:"600" },
  sfBtnTextActive: { color:"#111" },
  tabBar:      { backgroundColor:DARK.header, borderTopColor:DARK.border },
  itemRow:     { flexDirection:"row", gap:6, marginBottom:8, alignItems:"center" },
  rmBtn:       { backgroundColor:DARK.fail, borderRadius:4, padding:7, alignItems:"center", justifyContent:"center" },
  rmText:      { color:"#fff", fontSize:13, fontWeight:"700" },
  fillBarBg:   { backgroundColor:DARK.header, borderRadius:20, height:18, marginVertical:8, overflow:"hidden", borderWidth:1, borderColor:DARK.border },
  fillBar:     { height:"100%", borderRadius:20, alignItems:"flex-end", justifyContent:"center", paddingRight:6 },
  fillBarText: { fontSize:11, fontWeight:"700", color:"#111" },
  necItem:     { fontSize:12, color:"#ccc", paddingVertical:5, borderBottomWidth:1, borderBottomColor:"#2a2a2a", lineHeight:18 },
  totalLine:   { flexDirection:"row", justifyContent:"space-between", paddingVertical:3 },
  totalText:   { fontSize:14, color:DARK.text },
  grandText:   { fontSize:16, fontWeight:"700", color:DARK.accent },
  totalsBox:   { backgroundColor:DARK.header, borderWidth:1, borderColor:DARK.accent, borderRadius:6, padding:12, marginTop:10 },
});

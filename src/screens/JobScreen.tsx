import React, { useState, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

type JobItem = { id:number; desc:string; qty:string; unit:string };

const defaults: JobItem[] = [
  { id:1, desc:"", qty:"1", unit:"0.00" },
];

function JobInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);
  const [items,      setItems]      = useState<JobItem[]>(defaults);
  const [laborRate,  setLaborRate]  = useState("");
  const [laborHrs,   setLaborHrs]   = useState("");
  const [markup,     setMarkup]     = useState("");
  const [taxRate,    setTaxRate]    = useState("0");
  const [permitFee,  setPermitFee]  = useState("");
  const [company,    setCompany]    = useState("");
  const [phone,      setPhone]      = useState("");
  const [email,      setEmail]      = useState("");
  const [customer,   setCustomer]   = useState("");
  const [address,    setAddress]    = useState("");
  const [jobDesc,    setJobDesc]    = useState("");
  const [estNum,     setEstNum]     = useState("");
  const nextId = useRef(100);

  const upd = (id:number, k:keyof JobItem, v:string) =>
    setItems(items.map(it => it.id===id ? { ...it, [k]:v } : it));

  const matCost    = items.reduce((a,it) => a + (parseFloat(it.qty)||0)*(parseFloat(it.unit)||0), 0);
  const markupAmt  = matCost * ((parseFloat(markup)||0) / 100);
  const matTotal   = matCost + markupAmt;
  const labor      = (parseFloat(laborRate)||0) * (parseFloat(laborHrs)||0);
  const permit     = parseFloat(permitFee) || 0;
  const subtotal   = matTotal + labor + permit;
  const taxAmt     = subtotal * ((parseFloat(taxRate)||0) / 100);
  const grand      = subtotal + taxAmt;

  const exportPDF = async () => {
    const rows = items.map(it => {
      const cost = (parseFloat(it.qty)||0)*(parseFloat(it.unit)||0);
      const mkup = cost * ((parseFloat(markup)||0) / 100);
      const ext  = cost + mkup;
      return `
        <tr>
          <td>${it.desc}</td>
          <td style="text-align:center">${it.qty}</td>
          <td style="text-align:right">$${parseFloat(it.unit||"0").toFixed(2)}</td>
          <td style="text-align:right">$${cost.toFixed(2)}</td>
          <td style="text-align:right">$${ext.toFixed(2)}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin:0; padding:0; }
      body { font-family:Arial,sans-serif; font-size:13px; color:#222; padding:32px; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #f5a623; padding-bottom:16px; margin-bottom:24px; }
      .company-name { font-size:24px; font-weight:800; color:#f5a623; }
      .company-sub  { font-size:11px; color:#888; margin-top:4px; }
      .badge { background:#f5a623; color:#111; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; display:inline-block; margin-top:4px; }
      .header-right { text-align:right; font-size:12px; color:#555; line-height:22px; }
      .est-num { font-size:18px; font-weight:700; color:#222; }
      .section { margin-bottom:20px; }
      .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#888; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px; }
      .customer-name { font-size:15px; font-weight:700; color:#222; }
      .customer-sub  { font-size:12px; color:#555; line-height:20px; margin-top:2px; }
      .scope { font-size:12px; color:#444; line-height:20px; background:#f9f9f9; border-left:3px solid #f5a623; padding:10px 12px; border-radius:0 4px 4px 0; }
      table { width:100%; border-collapse:collapse; margin-bottom:4px; }
      th { background:#f5a623; color:#111; padding:8px 10px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
      td { padding:7px 10px; border-bottom:1px solid #eee; font-size:12px; vertical-align:middle; }
      tr:nth-child(even) td { background:#fafafa; }
      .totals-wrap { display:flex; justify-content:flex-end; margin-top:12px; }
      .totals { width:300px; }
      .trow { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; color:#444; border-bottom:1px solid #f0f0f0; }
      .trow-grand { display:flex; justify-content:space-between; padding:10px 0 0; font-size:16px; font-weight:800; color:#f5a623; }
      .footer { margin-top:40px; font-size:10px; color:#aaa; border-top:1px solid #eee; padding-top:14px; line-height:18px; }
      .sig-block { margin-top:32px; display:flex; gap:40px; }
      .sig-line { flex:1; border-top:1px solid #ccc; padding-top:6px; font-size:11px; color:#888; }
    </style></head><body>

      <div class="header">
        <div>
          <div class="company-name">${company || "Your Company Name"}</div>
          <div class="company-sub">${phone ? phone + "  •  " : ""}${email || ""}</div>
          <span class="badge">VoltForge PRO</span>
        </div>
        <div class="header-right">
          <div class="est-num">Estimate #${estNum || "—"}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
          <div>Valid for 30 days</div>
        </div>
      </div>

      <div style="display:flex; gap:32px; margin-bottom:24px;">
        <div class="section" style="flex:1">
          <div class="section-title">Bill To</div>
          <div class="customer-name">${customer || "—"}</div>
          <div class="customer-sub">${address || ""}</div>
        </div>
        ${jobDesc ? `<div class="section" style="flex:2">
          <div class="section-title">Scope of Work</div>
          <div class="scope">${jobDesc.replace(/\n/g,"<br>")}</div>
        </div>` : ""}
      </div>

      <div class="section">
        <div class="section-title">Materials</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center;width:60px">Qty</th>
              <th style="text-align:right;width:90px">Unit Cost</th>
              <th style="text-align:right;width:90px">Cost</th>
              <th style="text-align:right;width:90px">Extended</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="totals-wrap">
        <div class="totals">
          <div class="trow"><span>Material Cost</span><span>$${matCost.toFixed(2)}</span></div>
          ${parseFloat(markup) > 0 ? `<div class="trow"><span>Material Markup (${markup}%)</span><span>$${markupAmt.toFixed(2)}</span></div>` : ""}
          <div class="trow"><span>Labor (${laborHrs} hrs @ $${laborRate}/hr)</span><span>$${labor.toFixed(2)}</span></div>
          ${permit > 0 ? `<div class="trow"><span>Permit Fee</span><span>$${permit.toFixed(2)}</span></div>` : ""}
          ${parseFloat(taxRate) > 0 ? `<div class="trow"><span>Tax (${taxRate}%)</span><span>$${taxAmt.toFixed(2)}</span></div>` : ""}
          <div class="trow-grand"><span>TOTAL ESTIMATE</span><span>$${grand.toFixed(2)}</span></div>
        </div>
      </div>

      <div class="sig-block">
        <div class="sig-line">Customer Signature &amp; Date</div>
        <div class="sig-line">Contractor Signature &amp; Date</div>
      </div>

      <div class="footer">
        This estimate is for planning purposes only and is subject to change based on final measurements, material availability, and site conditions.
        All work performed per NEC and applicable local amendments. Permit fees, inspection fees, and sales tax not included unless stated above.
        Estimate valid 30 days from date issued.
      </div>
    </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType:"application/pdf", dialogTitle:"Share Estimate" });
    } catch {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    }
  };

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* ── Company Info ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Your Company</Text>
        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>Company Name</Text>
            <TextInput style={s.input} value={company} onChangeText={setCompany} placeholder="Your Company LLC" placeholderTextColor={C.muted}/>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>Estimate #</Text>
            <TextInput style={s.input} value={estNum} onChangeText={setEstNum} placeholder="1001" placeholderTextColor={C.muted}/>
          </View>
        </View>
        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>Phone</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="(555) 555-5555" placeholderTextColor={C.muted} keyboardType="phone-pad"/>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@company.com" placeholderTextColor={C.muted} keyboardType="email-address"/>
          </View>
        </View>
      </View>

      {/* ── Customer Info ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Customer</Text>
        <Text style={s.label}>Customer Name</Text>
        <TextInput style={s.input} value={customer} onChangeText={setCustomer} placeholder="John Smith" placeholderTextColor={C.muted}/>
        <Text style={s.label}>Address</Text>
        <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder="123 Main St, City, ST 00000" placeholderTextColor={C.muted}/>
        <Text style={s.label}>Scope of Work</Text>
        <TextInput
          style={[s.input, { height:80, textAlignVertical:"top" }]}
          value={jobDesc} onChangeText={setJobDesc}
          placeholder="Describe work to be performed..."
          placeholderTextColor={C.muted}
          multiline numberOfLines={3}
        />
      </View>

      {/* ── Materials ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Materials</Text>
        <View style={{ flexDirection:"row", marginBottom:4 }}>
          <Text style={[s.label, { flex:2 }]}>Description</Text>
          <Text style={[s.label, { width:52, textAlign:"center" }]}>Qty</Text>
          <Text style={[s.label, { width:68, textAlign:"center" }]}>$/ea</Text>
          <View style={{ width:36 }}/>
        </View>
        {items.map(it => (
          <View key={it.id} style={s.itemRow}>
            <TextInput style={[s.input, { flex:2, marginBottom:0 }]} value={it.desc} onChangeText={v=>upd(it.id,"desc",v)} placeholder="Item..." placeholderTextColor={C.muted}/>
            <TextInput style={[s.input, { width:52, marginBottom:0, textAlign:"center" }]} keyboardType="decimal-pad" value={it.qty} onChangeText={v=>upd(it.id,"qty",v)}/>
            <TextInput style={[s.input, { width:68, marginBottom:0, textAlign:"center" }]} keyboardType="decimal-pad" value={it.unit} onChangeText={v=>upd(it.id,"unit",v)}/>
            <TouchableOpacity style={s.rmBtn} onPress={() => setItems(items.filter(i=>i.id!==it.id))}>
              <Text style={s.rmText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[s.btn, s.btnOutline, { marginBottom:14 }]} onPress={() => setItems([...items,{id:nextId.current++,desc:"",qty:"1",unit:"0"}])}>
          <Text style={s.btnOutlineText}>+ Add Item</Text>
        </TouchableOpacity>

        <Text style={s.label}>Material Markup %</Text>
        <TextInput style={[s.input, { width:100 }]} keyboardType="decimal-pad" value={markup} onChangeText={setMarkup} placeholder="20" placeholderTextColor={C.muted}/>
      </View>

      {/* ── Labor & Fees ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Labor & Fees</Text>
        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>Rate ($/hr)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={laborRate} onChangeText={setLaborRate} placeholder="85" placeholderTextColor={C.muted}/>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>Est. Hours</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={laborHrs} onChangeText={setLaborHrs} placeholder="8" placeholderTextColor={C.muted}/>
          </View>
        </View>
        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>Permit Fee ($)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={permitFee} onChangeText={setPermitFee} placeholder="0.00" placeholderTextColor={C.muted}/>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>Tax Rate %</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={taxRate} onChangeText={setTaxRate} placeholder="0" placeholderTextColor={C.muted}/>
          </View>
        </View>
      </View>

      {/* ── Totals ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Summary</Text>
        <View style={s.totalsBox}>
          <View style={s.totalLine}><Text style={s.totalText}>Material Cost</Text><Text style={s.totalText}>${matCost.toFixed(2)}</Text></View>
          {parseFloat(markup) > 0 && (
            <View style={s.totalLine}><Text style={s.totalText}>Markup ({markup}%)</Text><Text style={s.totalText}>${markupAmt.toFixed(2)}</Text></View>
          )}
          <View style={s.totalLine}><Text style={s.totalText}>Labor</Text><Text style={s.totalText}>${labor.toFixed(2)}</Text></View>
          {permit > 0 && (
            <View style={s.totalLine}><Text style={s.totalText}>Permit Fee</Text><Text style={s.totalText}>${permit.toFixed(2)}</Text></View>
          )}
          {parseFloat(taxRate) > 0 && (
            <View style={s.totalLine}><Text style={s.totalText}>Tax ({taxRate}%)</Text><Text style={s.totalText}>${taxAmt.toFixed(2)}</Text></View>
          )}
          <View style={{ borderTopWidth:1, borderTopColor:"#444", marginTop:6, paddingTop:6 }}>
            <View style={s.totalLine}>
              <Text style={s.grandText}>TOTAL ESTIMATE</Text>
              <Text style={s.grandText}>${grand.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[s.btn, { marginTop:12 }]} onPress={exportPDF}>
          <Text style={s.btnText}>⬆  Export PDF / Share</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

export function JobScreen() {
  return <ProGate feature="Job Estimator & PDF Export"><JobInner/></ProGate>;
}

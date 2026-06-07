// Financeiro — Pagamentos do atleta + fluxo Pix
// Mantém a identidade: fundo #1A1A1A, cards #242424, acento lime, badges de status.

const TODAY = new Date(2026, 5, 5); // 05/06/2026 (referência para tempo relativo)

function money(v) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}
function parseD(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function fmtDM(s) { const d = parseD(s); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); }
function daysBetween(s) { return Math.round((parseD(s) - TODAY) / 86400000); }

// deriva o estado visual de uma cobrança
function chargeView(c) {
  if (c.status === "pago") return { kind: "pago", color: "var(--lime)", tint: "rgba(199,239,102,0.14)", badge: "PAGO", date: "Pago em " + fmtDM(c.pagamento), icon: "check_circle" };
  if (c.status === "isento") return { kind: "isento", color: "#9AA0A6", tint: "rgba(154,160,166,0.16)", badge: "ISENTO", date: "Isento pelo clube", icon: "info" };
  // pendente → deriva futuro vs vencido
  const dd = daysBetween(c.vencimento);
  if (dd < 0) return { kind: "vencido", color: "#FF5A5A", tint: "rgba(255,90,90,0.14)", badge: "EM ATRASO", date: "Venceu em " + fmtDM(c.vencimento), icon: "warning" };
  const rel = dd === 0 ? "vence hoje" : dd === 1 ? "vence amanhã" : "em " + dd + " dias";
  return { kind: "futuro", color: "#F0B429", tint: "rgba(240,180,41,0.14)", badge: "PENDENTE", date: "Vence em " + fmtDM(c.vencimento) + " · " + rel, icon: "schedule" };
}

function StatusPill({ view }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: view.tint, color: view.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.3px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: view.color }}></span>
      {view.badge}
    </span>
  );
}

function ChargeCard({ charge, onPay, onReceipt }) {
  const v = chargeView(charge);
  const payable = v.kind === "futuro" || v.kind === "vencido";
  return (
    <div style={{
      background: "#242424",
      borderRadius: 16,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      opacity: v.kind === "pago" || v.kind === "isento" ? 0.86 : 1,
      boxShadow: v.kind === "vencido" ? "inset 0 0 0 1px rgba(255,90,90,0.45)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusPill view={v} />
        <span style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{money(charge.valor)}</span>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{charge.nome}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <Icon name={v.icon} size={14} color={v.color} />
          <span style={{ fontSize: 12, color: v.color, fontWeight: 500 }}>{v.date}</span>
        </div>
      </div>
      {payable &&
        <button className="tap" onClick={() => onPay && onPay(charge)} style={{
          width: "100%", height: 44, borderRadius: 10, background: "var(--lime)", color: "#1A1A1A",
          fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 2, whiteSpace: "nowrap",
        }}>
          <Icon name="pix" size={18} color="#1A1A1A" />
          Pagar via Pix
        </button>
      }
      {v.kind === "pago" &&
        <button className="tap" onClick={() => onReceipt && onReceipt(charge)} style={{
          width: "100%", height: 40, borderRadius: 10, background: "transparent", border: "1px solid rgba(199,239,102,0.4)", color: "var(--lime)",
          fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 2, whiteSpace: "nowrap",
        }}>
          <Icon name="receipt" size={16} color="var(--lime)" />
          Ver comprovante
        </button>
      }
    </div>
  );
}

const TABS = [
  { id: "pendentes", label: "Pendentes" },
  { id: "pagas", label: "Pagas" },
  { id: "todas", label: "Todas" },
];

function Financeiro({ charges, onNavigate, onPay, onReceipt }) {
  const [tab, setTab] = React.useState("pendentes");

  const visible = charges.filter((c) => c.status !== "cancelado");
  const pendentes = visible.filter((c) => c.status === "pendente");
  const totalAberto = pendentes.reduce((s, c) => s + c.valor, 0);
  const overdue = pendentes.filter((c) => daysBetween(c.vencimento) < 0).length;
  const soon = pendentes.filter((c) => { const d = daysBetween(c.vencimento); return d >= 0 && d <= 3; }).length;

  const list = tab === "pendentes" ? pendentes : tab === "pagas" ? visible.filter((c) => c.status === "pago") : visible;

  let alert = null;
  if (overdue > 0) alert = { color: "#FF5A5A", text: overdue + (overdue > 1 ? " cobranças em atraso" : " cobrança em atraso") };
  else if (soon > 0) alert = { color: "#F0B429", text: soon + (soon > 1 ? " vencem em breve" : " vence em até 3 dias") };

  const tudoCerto = pendentes.length === 0;

  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      <div className="screen-scroll" style={{ paddingBottom: 8 }}>
        {/* title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 0 18px" }}>
          <Icon name="payments" size={20} color="var(--lime)" />
          <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Pagamentos</span>
        </div>

        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* faixa-resumo */}
          {tudoCerto ?
            <div style={{ background: "#242424", border: "1px solid var(--lime)", borderRadius: 16, padding: "20px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(199,239,102,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                <Icon name="check_circle" size={26} color="var(--lime)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Tudo certo</div>
                <div style={{ fontSize: 13, color: "#B2B2B2", marginTop: 2 }}>Nenhuma cobrança em aberto</div>
              </div>
            </div>
            :
            <div style={{ background: "#242424", borderRadius: 16, padding: "18px 18px 20px" }}>
              <div style={{ fontSize: 13, color: "#B2B2B2", fontWeight: 500 }}>Você tem em aberto</div>
              <div style={{ fontWeight: 800, fontSize: 34, color: "var(--lime)", lineHeight: 1.1, marginTop: 4, letterSpacing: "-0.5px" }}>{money(totalAberto)}</div>
              <div style={{ fontSize: 13, color: "#fff", marginTop: 4 }}>{pendentes.length} {pendentes.length > 1 ? "cobranças pendentes" : "cobrança pendente"}</div>
              {alert &&
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon name="warning" size={16} color={alert.color} />
                  <span style={{ fontSize: 13, color: alert.color, fontWeight: 600 }}>{alert.text}</span>
                </div>
              }
            </div>
          }

          {/* tabs */}
          <div style={{ display: "flex", gap: 6, background: "#242424", borderRadius: 999, padding: 4 }}>
            {TABS.map((t) => {
              const on = t.id === tab;
              const count = t.id === "pendentes" ? pendentes.length : null;
              return (
                <button key={t.id} className="tap" onClick={() => setTab(t.id)} style={{
                  flex: 1, height: 36, borderRadius: 999, fontSize: 13, fontWeight: 700,
                  background: on ? "var(--lime)" : "transparent", color: on ? "#1A1A1A" : "#B2B2B2",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  {t.label}
                  {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, opacity: on ? 0.7 : 1 }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* lista */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 8 }}>
            {list.length === 0 ?
              <div style={{ textAlign: "center", padding: "32px 0", color: "#B2B2B2", fontSize: 14 }}>
                {tab === "pagas" ? "Nenhum pagamento ainda." : "Nada por aqui."}
              </div>
              :
              list.map((c) => <ChargeCard key={c.id} charge={c} onPay={onPay} onReceipt={onReceipt} />)
            }
          </div>
        </div>
      </div>

      <BottomNav active="financeiro" onNavigate={onNavigate} />
    </div>
  );
}

function QRMock() {
  const N = 25, cell = 5;
  const finder = (x, y) => x < 7 && y < 7 || x >= N - 7 && y < 7 || x < 7 && y >= N - 7;
  const rects = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let on;
    if (finder(x, y)) {
      const fx = x >= N - 7 ? x - (N - 7) : x, fy = y >= N - 7 ? y - (N - 7) : y;
      on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
    } else {
      on = (x * 13 + y * 7 + x * y % 5) % 3 === 0;
    }
    if (on) rects.push(<rect key={x + "-" + y} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0c0c0c" />);
  }
  return <svg width={N * cell} height={N * cell} viewBox={`0 0 ${N * cell} ${N * cell}`} style={{ display: "block" }}>{rects}</svg>;
}

function PixPagamento({ charge, onBack, onConfirm, onReceipt }) {
  const [stage, setStage] = React.useState("idle"); // idle | processing | confirmed
  const [copied, setCopied] = React.useState(false);
  const pixCode = "00020126850014BR.GOV.BCB.PIX2563athletto." + (charge ? charge.id : "x") + ".5204000053039865802BR6009BoaVista62070503***6304A1B2";

  React.useEffect(() => {
    if (stage !== "processing") return;
    const t = setTimeout(() => setStage("confirmed"), 3600);
    return () => clearTimeout(t);
  }, [stage]);

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(pixCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 4px" }}>
        <button className="tap" onClick={onBack} style={{ display: "flex", color: "#fff" }}>
          <Icon name="arrow_back" size={24} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{charge ? charge.nome : "Pagamento"}</span>
      </div>

      {stage === "confirmed" ?
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 36px", textAlign: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(199,239,102,0.16)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Icon name="check_circle" size={56} color="var(--lime)" />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#fff" }}>Pagamento confirmado</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#B2B2B2", marginTop: 12, maxWidth: 280 }}>
            Recebemos {money(charge ? charge.valor : 0)} de <span style={{ color: "var(--lime)", fontWeight: 600 }}>{charge ? charge.nome : ""}</span>.
          </p>
          <button className="tap" onClick={() => onReceipt && onReceipt(charge)} style={{ ...primaryBtn, marginTop: 32, width: "100%", gap: 8 }}>
            <Icon name="receipt" size={20} color="#1A1A1A" />
            Ver comprovante
          </button>
          <button className="tap" onClick={() => onConfirm && onConfirm(charge.id)} style={{ marginTop: 16, color: "#fff", fontSize: 14, fontWeight: 600 }}>
            Voltar aos pagamentos
          </button>
        </div>
        :
        <div className="screen-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 28px 28px" }}>
          <span style={{ fontSize: 13, color: "#B2B2B2", fontWeight: 500 }}>Valor a pagar</span>
          <span style={{ fontWeight: 800, fontSize: 36, color: "#fff", letterSpacing: "-0.5px", marginTop: 4 }}>{money(charge ? charge.valor : 0)}</span>

          <div style={{ position: "relative", marginTop: 24, background: "#fff", borderRadius: 16, padding: 16 }}>
            <QRMock />
            {stage === "processing" &&
              <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(26,26,26,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <Icon name="autorenew" size={34} color="var(--lime)" style={{ animation: "spin 1.1s linear infinite" }} />
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Processando…</span>
              </div>
            }
          </div>

          {stage === "processing" ?
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Processando pagamento…</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "#B2B2B2", marginTop: 8, maxWidth: 280 }}>
                Estamos confirmando com o banco. A tela atualiza sozinha quando o pagamento cair.
              </p>
            </div>
            :
            <React.Fragment>
              <div style={{ width: "100%", marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="tap" onClick={copy} style={{
                  width: "100%", height: 50, borderRadius: 10, background: "var(--lime)", color: "#1A1A1A",
                  fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
                }}>
                  <Icon name={copied ? "check" : "content_copy"} size={20} color="#1A1A1A" />
                  {copied ? "Código copiado!" : "Copiar código Pix"}
                </button>
                <button className="tap" onClick={() => setStage("processing")} style={{
                  width: "100%", height: 50, borderRadius: 10, background: "transparent", border: "1px solid #737373", color: "#fff",
                  fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
                }}>
                  <Icon name="account_balance" size={20} />
                  Abrir no app do banco
                </button>
              </div>

              <div style={{ width: "100%", marginTop: 18, background: "#242424", borderRadius: 12, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Icon name="info" size={18} color="var(--lime)" style={{ flex: "0 0 auto", marginTop: 1 }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#B2B2B2" }}>
                  Após pagar, a confirmação aparece aqui automaticamente — você não precisa fazer mais nada.
                </span>
              </div>
            </React.Fragment>
          }
        </div>
      }
      <div className="home-indicator"><div className="bar"></div></div>
    </div>
  );
}

const ATHLETE = "Eric Almeida";

function txnId(charge) {
  const base = (charge ? charge.id : "x") + "athletto";
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  const hex = h.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return "ATH-2026-" + hex.slice(0, 4) + "-" + hex.slice(4);
}

function ReceiptRow({ label, value, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 12.5, color: "#9AA0A6", fontWeight: 500, flex: "0 0 auto" }}>{label}</span>
      <span style={{ fontSize: 13, color: accent ? "var(--lime)" : "#fff", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Comprovante({ charge, clubName, onBack }) {
  const ref = React.useRef(null);
  const [saved, setSaved] = React.useState(false);
  const valor = charge ? charge.valor : 0;
  const dataPg = charge && charge.pagamento ? fmtDM(charge.pagamento) + "/" + parseD(charge.pagamento).getFullYear() : "05/06/2026";

  const save = () => {
    const el = ref.current;
    const done = () => { setSaved(true); setTimeout(() => setSaved(false), 2400); };
    if (window.html2canvas && el) {
      window.html2canvas(el, { backgroundColor: "#101010", scale: 2, useCORS: true, logging: false }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "comprovante-athletto.png";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
          done();
        });
      }).catch(done);
    } else { done(); }
  };

  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 4px" }}>
        <button className="tap" onClick={onBack} style={{ display: "flex", color: "#fff" }}>
          <Icon name="arrow_back" size={24} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Comprovante</span>
      </div>

      <div className="screen-scroll" style={{ flex: 1, padding: "12px 24px 24px" }}>
        {/* receipt */}
        <div ref={ref} style={{ background: "#101010", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* header */}
          <div style={{ background: "var(--lime)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <AthlettoMark size={28} fill="#1A1A1A" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.5px", textTransform: "uppercase" }}>Comprovante Pix</span>
          </div>

          <div style={{ padding: "26px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(199,239,102,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check_circle" size={36} color="var(--lime)" />
            </div>
            <div style={{ fontSize: 13, color: "#9AA0A6", marginTop: 16, fontWeight: 500 }}>Valor pago</div>
            <div style={{ fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: "-0.5px", marginTop: 2 }}>{money(valor)}</div>

            <div style={{ width: "100%", borderTop: "1px dashed rgba(255,255,255,0.18)", margin: "22px 0 18px" }}></div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 13 }}>
              <ReceiptRow label="Cobrança" value={charge ? charge.nome : "—"} />
              <ReceiptRow label="Atleta" value={ATHLETE} />
              <ReceiptRow label="Clube" value={clubName || "—"} />
              <ReceiptRow label="Forma de pagamento" value="Pix" />
              <ReceiptRow label="Data do pagamento" value={dataPg} />
              <ReceiptRow label="ID da transação" value={txnId(charge)} />
              <ReceiptRow label="Status" value="Pago ✓" accent />
            </div>

            <div style={{ width: "100%", borderTop: "1px dashed rgba(255,255,255,0.18)", margin: "18px 0 16px" }}></div>

            <span style={{ fontSize: 11, color: "#676D75", textAlign: "center", lineHeight: 1.5 }}>
              Athletto · documento gerado pelo app<br />Guarde este comprovante como recibo do pagamento.
            </span>
          </div>
        </div>

        {/* actions */}
        <button className="tap" onClick={save} style={{
          width: "100%", height: 50, marginTop: 22, borderRadius: 10, background: "var(--lime)", color: "#1A1A1A",
          fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          <Icon name={saved ? "check" : "download"} size={20} color="#1A1A1A" />
          {saved ? "Comprovante salvo!" : "Salvar comprovante"}
        </button>
      </div>
      <div className="home-indicator"><div className="bar"></div></div>
    </div>
  );
}

Object.assign(window, { Financeiro, PixPagamento, Comprovante });

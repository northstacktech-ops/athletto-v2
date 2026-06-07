// App root — navigation flow between all screens

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: 120,
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.82)",
      color: "var(--lime)",
      fontSize: 13,
      fontWeight: 600,
      padding: "10px 18px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      zIndex: 60,
      animation: "fadeIn 0.2s ease both",
    }}>{msg}</div>
  );
}

function App() {
  const [screen, setScreen] = React.useState("splash");
  const [toast, setToast] = React.useState("");
  const [club, setClub] = React.useState(null);
  // Nornas already has a password (returning member → login flow);
  // Berserkers has none (first access → create-password flow).
  const [passwords, setPasswords] = React.useState({ berserkers: null, nornas: "1234" });
  const [charges, setCharges] = React.useState([
    { id: "mai26", nome: "Mensalidade Maio 2026", valor: 150, status: "pendente", vencimento: "2026-05-10" },
    { id: "unif26", nome: "Uniforme 2026", valor: 120, status: "pendente", vencimento: "2026-06-30" },
    { id: "abr26", nome: "Mensalidade Abril 2026", valor: 150, status: "pago", vencimento: "2026-04-10", pagamento: "2026-04-05" },
    { id: "mar26", nome: "Mensalidade Março 2026", valor: 150, status: "pago", vencimento: "2026-03-10", pagamento: "2026-03-03" },
    { id: "insc", nome: "Taxa de inscrição", valor: 80, status: "isento", vencimento: "2026-02-01" },
  ]);
  const [payingCharge, setPayingCharge] = React.useState(null);
  const [receiptCharge, setReceiptCharge] = React.useState(null);
  const [openAlert, setOpenAlert] = React.useState(null);
  const [prefs, setPrefs] = React.useState({ push: true, pgto: true });
  const [alerts, setAlerts] = React.useState([
    { id: "a1", tipo: "vencido", grupo: "hoje", lido: false, titulo: "Mensalidade em atraso", msg: "A Mensalidade de Maio venceu. Regularize para evitar bloqueio.", detalhe: "Sua Mensalidade de Maio 2026 (R$ 150,00) venceu em 10/05. Pague via Pix direto pelo app para regularizar sua situa\u00e7\u00e3o no clube.", tempo: "H\u00e1 2 horas", acao: { label: "Ir para pagamentos", icon: "payments", go: "financeiro" } },
    { id: "a2", tipo: "evento", grupo: "hoje", lido: false, titulo: "Treino Oficial confirmado", msg: "Hoje \u00e0s 14:45h no campo principal. N\u00e3o esque\u00e7a o uniforme.", detalhe: "O Treino Oficial do Time est\u00e1 confirmado para hoje, 14:45h, no campo principal. Chegue 15 minutos antes para o aquecimento.", tempo: "H\u00e1 5 horas", acao: { label: "Ver na agenda", icon: "calendar_today", go: "agenda" } },
    { id: "a3", tipo: "senha", grupo: "hoje", lido: false, titulo: "Senha redefinida pelo gestor", msg: "O gestor liberou a redefini\u00e7\u00e3o da sua senha. Crie uma nova agora.", detalhe: "O gestor do clube atendeu \u00e0 sua solicita\u00e7\u00e3o e liberou a redefini\u00e7\u00e3o de senha. Crie uma nova senha para voltar a acessar normalmente.", tempo: "Hoje, 09:12", acao: { label: "Criar nova senha", icon: "lock_reset", go: "criarSenha" } },
    { id: "a4", tipo: "clube", grupo: "antes", lido: false, titulo: "Feijoada beneficente", msg: "Confirme presen\u00e7a at\u00e9 sexta. Renda revertida para o time sub-15.", detalhe: "O clube vai realizar uma feijoada beneficente em 31/05. A renda ser\u00e1 revertida para o time sub-15. Confirme sua presen\u00e7a com a coordena\u00e7\u00e3o at\u00e9 sexta-feira.", tempo: "Ontem" },
    { id: "a5", tipo: "financeiro", grupo: "antes", lido: true, titulo: "Pagamento confirmado", msg: "Recebemos sua Mensalidade de Abril (R$ 150,00). Obrigado!", detalhe: "Recebemos o pagamento da sua Mensalidade de Abril 2026 (R$ 150,00) via Pix. O comprovante est\u00e1 dispon\u00edvel na aba Financeiro.", tempo: "05/04/2026" },
  ]);
  const toastTimer = React.useRef(null);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1500);
  };

  const navigate = (id) => {
    if (id === "home") setScreen("home");
    else if (id === "agenda") setScreen("agenda");
    else if (id === "financeiro") setScreen("financeiro");
    else if (id === "alertas") setScreen("alertas");
    else if (id === "perfil") setScreen("perfil");
    else flash("Em breve");
  };

  const readAll = () => setAlerts((as) => as.map((a) => ({ ...a, lido: true })));
  const openAlertDetail = (a) => {
    setAlerts((as) => as.map((x) => x.id === a.id ? { ...x, lido: true } : x));
    setOpenAlert(a);
    setScreen("alertaDetalhe");
  };
  const alertAction = (a) => { if (a.acao && a.acao.go) setScreen(a.acao.go); };
  const setPref = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const logout = () => { setClub(null); setScreen("clube01"); };

  const startPay = (charge) => { setPayingCharge(charge); setScreen("pix"); };
  const confirmPay = (id) => {
    setCharges((cs) => cs.map((c) => c.id === id ? { ...c, status: "pago", pagamento: "2026-06-05" } : c));
    setScreen("financeiro");
  };
  const openReceipt = (charge) => { setReceiptCharge(charge); setScreen("comprovante"); };
  const receiptFromPix = (charge) => {
    const paid = { ...charge, status: "pago", pagamento: "2026-06-05" };
    setCharges((cs) => cs.map((c) => c.id === charge.id ? paid : c));
    setReceiptCharge(paid);
    setScreen("comprovante");
  };

  const selectClub = (c) => {
    setClub(c);
    setScreen(passwords[c.id] ? "login" : "criarSenha");
  };

  const createPassword = (pwd) => {
    if (club) setPasswords((p) => ({ ...p, [club.id]: pwd }));
    setScreen("home");
  };

  let view;
  switch (screen) {
    case "splash":
      view = <Splash key="splash" onDone={() => setScreen("onboarding")} />;
      break;
    case "onboarding":
      view = <Onboarding key="onboarding" onDone={() => setScreen("clube01")} />;
      break;
    case "clube01":
      view = <BuscarClube01 key="clube01" onBuscar={() => setScreen("clube02")} />;
      break;
    case "clube02":
      view = <BuscarClube02 key="clube02" onSelect={selectClub} onBack={() => setScreen("clube01")} />;
      break;
    case "criarSenha":
      view = <CriarSenha key="criarSenha" club={club} onCreate={createPassword} onBack={() => setScreen("clube02")} />;
      break;
    case "login":
      view = <Login key="login" club={club} onSubmit={() => setScreen("home")} onForgot={() => setScreen("reset")} onBack={() => setScreen("clube02")} />;
      break;
    case "reset":
      view = <ResetEnviado key="reset" club={club} onUnderstood={() => setScreen("login")} />;
      break;
    case "home":
      view = <Home key="home" onNavigate={navigate} />;
      break;
    case "agenda":
      view = <Agenda key="agenda" onNavigate={navigate} />;
      break;
    case "financeiro":
      view = <Financeiro key="financeiro" charges={charges} onNavigate={navigate} onPay={startPay} onReceipt={openReceipt} />;
      break;
    case "pix":
      view = <PixPagamento key="pix" charge={payingCharge} onBack={() => setScreen("financeiro")} onConfirm={confirmPay} onReceipt={receiptFromPix} />;
      break;
    case "comprovante":
      view = <Comprovante key="comprovante" charge={receiptCharge} clubName={club ? club.name : "Boa Vista Berserkers"} onBack={() => setScreen("financeiro")} />;
      break;
    case "alertas":
      view = <Alertas key="alertas" alerts={alerts} onNavigate={navigate} onOpen={openAlertDetail} onReadAll={readAll} />;
      break;
    case "alertaDetalhe":
      view = <AlertaDetalhe key="alertaDetalhe" alert={openAlert} onBack={() => setScreen("alertas")} onAction={alertAction} />;
      break;
    case "perfil":
      view = <Perfil key="perfil" club={club} prefs={prefs} onPref={setPref} onNavigate={navigate} onTrocarClube={() => setScreen("clube02")} onSair={logout} />;
      break;
    default:
      view = null;
  }

  return (
    <Device>
      {view}
      <Toast msg={toast} />
    </Device>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

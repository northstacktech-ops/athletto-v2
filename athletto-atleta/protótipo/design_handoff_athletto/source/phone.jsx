// Shared device chrome: StatusBar, Device frame, BottomNav

const SignalIcon = () => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
    <rect x="0" y="8" width="3" height="4" rx="1"/>
    <rect x="4.5" y="6" width="3" height="6" rx="1"/>
    <rect x="9" y="3.5" width="3" height="8.5" rx="1"/>
    <rect x="13.5" y="1" width="3" height="11" rx="1"/>
  </svg>
);

const WifiIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
    <path d="M8.5 2.2c2.6 0 5 1 6.8 2.7.2.2.6.2.8 0l.7-.7c.2-.2.2-.6 0-.8C14.5 1 11.6 0 8.5 0 5.4 0 2.5 1 .2 3.4c-.2.2-.2.6 0 .8l.7.7c.2.2.6.2.8 0C3.5 3.2 5.9 2.2 8.5 2.2z"/>
    <path d="M8.5 6c1.3 0 2.6.5 3.5 1.4.2.2.6.2.8 0l.7-.7c.2-.2.2-.6 0-.8C12 4.5 10.3 3.8 8.5 3.8S5 4.5 3.5 5.9c-.2.2-.2.6 0 .8l.7.7c.2.2.6.2.8 0C5.9 6.5 7.2 6 8.5 6z"/>
    <path d="M8.5 9.6l1.7-1.7c-.5-.5-1.1-.7-1.7-.7s-1.2.2-1.7.7L8.5 9.6z"/>
  </svg>
);

const BatteryIcon = () => (
  <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
    <rect x="0.5" y="0.8" width="21" height="10.4" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1"/>
    <rect x="2" y="2.3" width="18" height="7.4" rx="1.6"/>
    <path d="M23 4v4c.9-.4.9-3.6 0-4z"/>
  </svg>
);

function StatusBar({ dark, time = "9:41" }) {
  return (
    <div className={"statusbar " + (dark ? "sb-dark" : "sb-light")}>
      <span className="time">{time}</span>
      <span className="glyphs">
        <SignalIcon /><WifiIcon /><BatteryIcon />
      </span>
    </div>
  );
}

function Device({ children }) {
  return (
    <div className="device">
      <div className="device-screen">
        <div className="island"></div>
        {children}
      </div>
    </div>
  );
}

// Bottom navigation for Home / Agenda
const NAV_ITEMS = [
  { id: "home", label: "Início", icon: "home" },
  { id: "agenda", label: "Agenda", icon: "calendar_today" },
  { id: "financeiro", label: "Financeiro", icon: "payments" },
  { id: "alertas", label: "Alertas", icon: "error" },
  { id: "perfil", label: "Perfil", icon: "person" },
];

function BottomNav({ active, onNavigate }) {
  return (
    <div style={{ flex: "0 0 auto", background: "transparent" }}>
      <div style={{
        background: "#1A1A1A",
        borderRadius: "12px 12px 0 0",
        padding: "12px",
        display: "flex",
        justifyContent: "space-between",
      }}>
        {NAV_ITEMS.map((item) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              className="tap"
              onClick={() => onNavigate && onNavigate(item.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                color: on ? "var(--lime)" : "#676D75",
              }}
            >
              <Icon name={item.icon} size={24} color={on ? "var(--lime)" : "#676D75"} />
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, lineHeight: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="home-indicator" style={{ background: "#1A1A1A" }}>
        <div className="bar"></div>
      </div>
    </div>
  );
}

Object.assign(window, { StatusBar, Device, BottomNav });

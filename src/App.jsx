import React, { useState, useEffect, useRef } from "react";

/* =========================================================================
 * 공항가자 (Let's Go to the Airport)
 * 카카오T 내부 분리형 진입점 + 부분 일체형 LLM 공항 이동 어시스턴트
 * - 단일 React 파일 / mock data / Vercel 배포용
 * - 이미지는 /images/*.png 경로 사용 (배포 시 public/images/ 에 배치)
 * ========================================================================= */

const C = {
  blue: "#62B6FF",
  blueSoft: "#EAF4FF",
  blueLine: "#CDE6FF",
  navy: "#292B4A",
  navySoft: "#3A3D63",
  yellow: "#FACD00",
  orange: "#FFAC2C",
  bg: "#F4F6FB",
  card: "#FFFFFF",
  line: "#ECEEF4",
  ink: "#1C1E33",
  sub: "#6B6F87",
  faint: "#9AA0B8",
  ok: "#27AE8B",
  okSoft: "#E7F7F1",
  warnSoft: "#FFF6E6",
  warn: "#C98A1E",
};

const FONT =
  '"Pretendard","Pretendard Variable",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif';

const IMAGES = {
  ticket: "/images/항공권예매완료.png",
  platform: "/images/광명역플랫폼.png",
  elevator: "/images/엘리베이터.png",
  tomntoms: "/images/탐앤탐스.png",
  busStop: "/images/공항버스정류장.png",
  bus6770: "/images/6770버스.png",
  luggage: "/images/6770짐싣기.png",
  airportExterior: "/images/인천공항터미널.png",
  airportInterior: "/images/인천공항터미널내부.png",
  logo: "/images/아이콘.jpg",
};

/* 항공편 / 시나리오 mock */
const FLIGHT = {
  airline: "아시아나항공",
  code: "OZ0108",
  from: "ICN T2",
  fromCity: "인천",
  to: "SYD",
  toCity: "시드니",
  date: "2026.06.24 (수)",
  dep: "21:00",
  arr: "09:50",
  arrDate: "2026.06.25 (목)",
  pax: "김지현",
  age: "31세",
  seat: "일반석",
  daysLeft: 22,
};

/* 사진 기반 환승 단계 */
const PHOTO_STEPS = [
  {
    img: IMAGES.platform,
    kicker: "Step 1 · 광명역 플랫폼",
    alt: "광명역 플랫폼의 호차번호 전광판",
    title: "플랫폼에서 10호차 위치 찾기",
    body: "하차 후, 플랫폼의 호차번호 안내를 확인해주세요. 10이라고 적힌 위치까지 걸어가면 엘리베이터를 찾기 쉬워요.",
  },
  {
    img: IMAGES.elevator,
    kicker: "Step 2 · 엘리베이터",
    alt: "광명역 플랫폼의 유리 엘리베이터",
    title: "엘리베이터 타고 1층으로",
    body: "10호차 위치 근처에 있는 엘리베이터를 타고 1층으로 이동해주세요. 캐리어가 2개 있으니 계단보다 엘리베이터를 이용하는 편이 안전해요.",
  },
  {
    img: IMAGES.tomntoms,
    kicker: "Step 3 · 탐앤탐스",
    alt: "1층의 탐앤탐스 카페 매장",
    title: "탐앤탐스 기준 왼쪽으로",
    body: "1층에 도착하면 탐앤탐스 카페가 보일 거예요. 탐앤탐스 매장을 기준으로 왼쪽으로 걸어가면 4번 출구가 있어요.",
  },
  {
    img: IMAGES.busStop,
    kicker: "Step 4 · 4번 출구",
    alt: "광명역 공항버스 정류장",
    title: "4번 출구로 나가 정류장 찾기",
    body: "4번 출구로 나오면 왼쪽 방향에 6770번 공항버스 정류장이 있어요. 정류장 위치를 확인한 뒤, 버스 번호를 다시 한 번 확인해주세요.",
  },
  {
    img: IMAGES.bus6770,
    kicker: "Step 5 · 6770 버스",
    alt: "KTX 6770 리무진 공항버스",
    title: "6770번 버스 번호 확인",
    body: "버스 앞쪽에 6770 번호가 보이는지 확인해주세요. 이 버스는 인천공항 제2여객터미널 방향으로 이동합니다.",
  },
  {
    img: IMAGES.luggage,
    kicker: "Step 6 · 짐 싣기",
    alt: "버스 짐칸에 캐리어를 싣는 모습",
    title: "캐리어 짐칸에 싣기",
    body: "6770번 버스가 도착하면 기사님이 짐 싣는 것을 도와주실 거예요. 목적지를 물어보시면 “제2여객터미널이요”라고 말씀하시면 됩니다. 요금은 버스 앞 리더기에 카드로 태깅하면 돼요.",
  },
];

const CONFUSED_STEPS = [
  {
    body:
      "괜찮아요, 지현 님. 지금은 플랫폼에서 엘리베이터를 찾는 단계예요.\n\n주변에 있는 호차번호 안내판을 먼저 봐주세요. 10이라고 적힌 위치 쪽으로 걸어가면 엘리베이터가 가까워요.\n\n캐리어가 2개 있으니 계단이나 에스컬레이터보다 엘리베이터를 이용하는 편이 더 안전해요.",
    btns: ["10호차 위치 찾았어요", "엘리베이터가 안 보여요", "사진 다시 보기"],
  },
  {
    body:
      "좋아요. 지금은 엘리베이터를 타고 1층으로 내려가는 단계예요.\n\n엘리베이터 안에서 1층 버튼을 눌러주세요. 1층에 도착하면 탐앤탐스 카페를 기준점으로 삼으면 길을 찾기 쉬워요.",
    btns: ["1층에 도착했어요", "탐앤탐스가 안 보여요", "다시 설명해줘"],
  },
  {
    body:
      "괜찮아요. 탐앤탐스 매장을 기준으로 다시 볼게요.\n\n탐앤탐스 정면을 바라본 상태에서 왼쪽 방향으로 걸어가면 4번 출구가 나와요. 4번 출구 표지판이 보이면 그 방향으로 계속 이동해주세요.",
    btns: ["4번 출구 찾았어요", "방향이 헷갈려요", "사진 다시 보기"],
  },
  {
    body:
      "좋아요. 지금은 4번 출구 밖에서 6770번 공항버스 정류장을 찾는 단계예요.\n\n4번 출구로 나온 뒤 왼쪽 방향을 확인해주세요. 정류장 표지판이나 6770번 버스 안내가 보이면 그 근처에서 대기하면 됩니다.\n\n버스가 오면 앞쪽 번호가 6770인지 꼭 확인해주세요.",
    btns: ["정류장 찾았어요", "6770이 안 보여요", "버스를 놓쳤어요"],
  },
  {
    body:
      "괜찮아요. 탑승 전에 버스 번호만 다시 확인하면 돼요.\n\n버스 앞쪽 또는 옆면에 6770 번호가 보이는지 확인해주세요. 기사님이 목적지를 물어보시면 “제2여객터미널이요”라고 말씀하시면 됩니다.",
    btns: ["6770 확인했어요", "기사님께 뭐라고 말해?", "짐은 어디에 실어?"],
  },
  {
    body:
      "좋아요. 지금은 캐리어를 버스 짐칸에 싣는 단계예요.\n\n6770번 버스가 도착하면 기사님이 짐칸을 열어주실 거예요. 캐리어 2개를 모두 짐칸에 실은 뒤, 백팩은 가지고 버스에 탑승하면 됩니다.\n\n도착 후에는 기사님이 짐을 내려주실 수 있으니, 캐리어 2개를 모두 챙겼는지만 다시 확인해주세요.",
    btns: ["짐 실었어요", "캐리어가 2개예요", "요금은 어떻게 내?"],
  },
];

/* ---------------- 공통 UI 요소 ---------------- */

/* 공항가자 로고 (원형/라운드, 로드 실패 시 ✈ 폴백) */
function Logo({ size = 30, radius, ring }) {
  const [err, setErr] = useState(false);
  const r = radius != null ? radius : size >= 44 ? 14 : 999;
  const common = {
    width: size,
    height: size,
    borderRadius: r,
    flexShrink: 0,
    overflow: "hidden",
    boxShadow: ring ? `0 0 0 2px ${C.yellow}` : "none",
    background: "#fff",
  };
  if (err) {
    return (
      <div
        style={{
          ...common,
          background: C.navy,
          color: C.yellow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.5,
          fontWeight: 800,
        }}
      >
        ✈
      </div>
    );
  }
  return (
    <div style={common}>
      <img
        src={IMAGES.logo}
        alt="공항가자 로고"
        onError={() => setErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function GuideImage({ src, alt, kicker }) {
  const [err, setErr] = useState(false);
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        background: C.navy,
        position: "relative",
        aspectRatio: "16 / 10",
      }}
    >
      {!err ? (
        <img
          src={src}
          alt={alt}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 18,
            textAlign: "center",
            background:
              "linear-gradient(135deg, #2F3258 0%, #292B4A 60%, #1F2140 100%)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1,
              color: C.blue,
              fontWeight: 700,
            }}
          >
            {kicker || "현장 사진"}
          </div>
          <div style={{ fontSize: 13.5, color: "#E6E9F5", lineHeight: 1.5 }}>
            {alt}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    최상: { bg: C.okSoft, fg: C.ok },
    상: { bg: C.blueSoft, fg: "#2C7BD6" },
    중: { bg: C.warnSoft, fg: C.warn },
  };
  const s = map[level] || map["상"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 11.5,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      안정성 {level}
    </span>
  );
}

function Chip({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? C.blue : C.blueLine}`,
        background: active ? C.blue : "#fff",
        color: active ? "#fff" : "#2C7BD6",
        fontSize: 12.5,
        fontWeight: 600,
        padding: "8px 12px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: FONT,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, tone = "navy", full = true, small }) {
  const bg =
    tone === "yellow" ? C.yellow : tone === "blue" ? C.blue : C.navy;
  const fg = tone === "yellow" ? C.navy : "#fff";
  return (
    <button
      onClick={onClick}
      style={{
        width: full ? "100%" : "auto",
        border: "none",
        background: bg,
        color: fg,
        fontSize: small ? 13.5 : 15,
        fontWeight: 700,
        padding: small ? "10px 14px" : "14px 16px",
        borderRadius: 14,
        cursor: "pointer",
        fontFamily: FONT,
        boxShadow: "0 6px 16px rgba(41,43,74,0.14)",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: `1px solid ${C.line}`,
        background: "#fff",
        color: C.ink,
        fontSize: small ? 13 : 14,
        fontWeight: 600,
        padding: small ? "9px 12px" : "12px 14px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: FONT,
      }}
    >
      {children}
    </button>
  );
}

function AIBubble({ children, name = true }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ marginTop: 2 }}>
        <Logo size={30} radius={9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {name && (
          <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 4, fontWeight: 600 }}>
            공항가자 LLM
          </div>
        )}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.line}`,
            borderRadius: "4px 16px 16px 16px",
            padding: "12px 14px",
            fontSize: 13.5,
            lineHeight: 1.65,
            color: C.ink,
            whiteSpace: "pre-line",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          maxWidth: "82%",
          background: C.yellow,
          color: C.navy,
          borderRadius: "16px 4px 16px 16px",
          padding: "11px 14px",
          fontSize: 13.5,
          lineHeight: 1.6,
          fontWeight: 500,
          whiteSpace: "pre-line",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{children}</div>
      {sub && (
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, lineHeight: 1.5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* 항공편 미니 요약 카드 */
function FlightMini() {
  return (
    <div
      style={{
        background: C.navy,
        borderRadius: 16,
        padding: "14px 16px",
        color: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: C.yellow, fontWeight: 700 }}>
          {FLIGHT.airline} {FLIGHT.code}
        </span>
        <span style={{ fontSize: 11.5, color: "#B9BEDD" }}>{FLIGHT.date}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{FLIGHT.dep}</div>
          <div style={{ fontSize: 11.5, color: "#B9BEDD" }}>{FLIGHT.from}</div>
        </div>
        <div style={{ flex: 1, position: "relative", height: 1, background: "#4A4D75" }}>
          <span
            style={{
              position: "absolute",
              top: -9,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 13,
            }}
          >
            ✈
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{FLIGHT.arr}</div>
          <div style={{ fontSize: 11.5, color: "#B9BEDD" }}>{FLIGHT.toCity} {FLIGHT.to}</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 11,
          borderTop: "1px solid #3D406A",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11.5, color: "#B9BEDD" }}>탑승자</span>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>
          {FLIGHT.pax} · {FLIGHT.age} · {FLIGHT.seat}
        </span>
      </div>
    </div>
  );
}

/* =========================================================================
 *  MAIN APP
 * ========================================================================= */

export default function App() {
  // 화면: entry, flight, onboarding, analyzing, routes, booking, timeline (이동 전)
  //       alert, photo, arrival, checkin (이동 중)
  const [screen, setScreen] = useState("entry");
  const [tab, setTab] = useState("pre"); // pre | on

  // 온보딩 선택 상태
  const [pref, setPref] = useState("이동 시간 최소화");
  const [familiarity, setFamiliarity] = useState("거의 처음이에요");

  // 경로 화면 상태
  const [selectedRoute, setSelectedRoute] = useState(1);
  const [routeChat, setRouteChat] = useState([]); // 경로 카드 아래 채팅
  const [routeChips, setRouteChips] = useState(false);

  // 채팅 입력 보조 (이동 전 공통)
  const [offTopic, setOffTopic] = useState(null); // 'scope' | 'block' | null

  // 분석 진행
  const [analyzeStep, setAnalyzeStep] = useState(0);

  // 이동 중
  const [ktxDelayed, setKtxDelayed] = useState(null); // null | 'ontime' | 'delay'
  const [photoStep, setPhotoStep] = useState(0);
  const [alertChat, setAlertChat] = useState(0); // 광명역 30분 전 대화 진행 단계

  // 이동 중 통합 자연어 채팅
  const [onTripChat, setOnTripChat] = useState([]); // {role:'user'|'ai', text, btns?, img?}
  const [onTripChips, setOnTripChips] = useState(false); // 입력창 클릭 시 추천칩
  const [onTripSheet, setOnTripSheet] = useState(false); // + 버튼 바텀시트

  // 예매 확인 모달
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booked, setBooked] = useState(false);

  // 체크리스트 / 도착 체크
  const [checked, setChecked] = useState({});
  const [arrivalCheck, setArrivalCheck] = useState({});

  const scrollRef = useRef(null);

  // Pretendard 폰트 주입(가능 시)
  useEffect(() => {
    if (document.getElementById("pretendard-cdn")) return;
    const l = document.createElement("link");
    l.id = "pretendard-cdn";
    l.rel = "stylesheet";
    l.href =
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css";
    document.head.appendChild(l);
  }, []);

  // 화면 전환 시 상단으로
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screen]);

  // 분석 화면 애니메이션
  useEffect(() => {
    if (screen !== "analyzing") return;
    setAnalyzeStep(0);
    const t = setInterval(() => {
      setAnalyzeStep((s) => {
        if (s >= 6) {
          clearInterval(t);
          setTimeout(() => goto("routes"), 650);
          return s;
        }
        return s + 1;
      });
    }, 430);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [screen]);

  function goto(s, nextTab) {
    if (nextTab) setTab(nextTab);
    setScreen(s);
    setOnTripChips(false);
    setOnTripSheet(false);
    setOnTripChat([]);
    setRouteChips(false);
    if (s !== "routes") setRouteChat([]);
  }

  function switchTab(t) {
    setTab(t);
    if (t === "pre") {
      // 이동 전 마지막 도달 화면 유지가 자연스러우나 시연상 timeline로
      setScreen((cur) =>
        ["entry", "flight", "onboarding", "analyzing", "routes", "booking", "timeline"].includes(cur)
          ? cur
          : "timeline"
      );
    } else {
      setScreen((cur) =>
        ["alert", "photo", "arrival", "checkin"].includes(cur) ? cur : "alert"
      );
    }
  }

  // 이동 중 자연어 질문 → 현재 단계 맥락 기반 LLM 응답 생성
  function askOnTrip(input) {
    const q = (input || "").trim();
    if (!q) return;
    const step = photoStep;
    const cur = PHOTO_STEPS[step];
    const con = CONFUSED_STEPS[step];
    let ai;
    if (/헷갈|이 단계가|모르겠/.test(q)) {
      ai = { role: "ai", text: con.body, btns: con.btns, img: cur };
    } else if (/사진 다시|사진.*보여/.test(q)) {
      ai = { role: "ai", text: `${cur.kicker} 사진을 다시 보여드릴게요.\n\n${cur.body}`, img: cur };
    } else if (/버스를 놓|놓쳤/.test(q)) {
      ai = {
        role: "ai",
        text:
          "아직 가능한 플랜이 있어요. 다음 6770번 버스 도착까지 약 18분 남았고, 공항 도착 여유는 충분해요. 광명역에서 대기하는 것이 가장 안정적이에요.\n\n더 빠른 전환을 원하시면 6번 출구의 6004번이나 택시 전환도 안내해드릴게요.",
        btns: ["다음 6770 대기", "6004 대안 확인", "택시 전환"],
      };
    } else if (/엘리베이터.*(안 보|안보|못 찾)/.test(q)) {
      ai = {
        role: "ai",
        text:
          "괜찮아요. 호차번호 안내판에서 10이라고 적힌 위치 쪽으로 조금 더 걸어가 보세요. 그 근처에 유리로 된 엘리베이터가 있어요. 캐리어가 2개 있으니 엘리베이터가 더 안전해요.",
        img: PHOTO_STEPS[1],
      };
    } else if (/다음.*(단계|어디|뭐)|다음엔/.test(q)) {
      if (step < PHOTO_STEPS.length - 1) {
        const nx = PHOTO_STEPS[step + 1];
        ai = { role: "ai", text: `다음은 '${nx.title}' 단계예요.\n\n${nx.body}`, img: nx };
      } else {
        ai = { role: "ai", text: "다음은 인천공항 제2여객터미널 3층 도착이에요. 기사님이 캐리어를 내려주시면 2개를 모두 챙겼는지 확인해주세요." };
      }
    } else if (/지금 어디|어디로 가|내리면/.test(q)) {
      ai = { role: "ai", text: `지금은 '${cur.title}' 단계예요.\n\n${cur.body}`, img: cur };
    } else if (/방향이 헷갈/.test(q)) {
      ai = { role: "ai", text: "탐앤탐스 매장 정면을 바라본 상태에서 왼쪽이 4번 출구 방향이에요. 출구 번호 표지판을 따라 계속 이동하면 됩니다." };
    } else if (/탐앤탐스.*(안 보|못 찾)|6770이 안 보|정류장.*(안 보|못 찾)/.test(q)) {
      ai = {
        role: "ai",
        text:
          "괜찮아요. 주변 안내 표지판을 천천히 확인해보세요. 보이지 않으면 가까운 역무원이나 안내데스크에 '6770 공항버스 정류장'을 물어보셔도 돼요. 사진도 다시 보여드릴게요.",
        img: cur,
      };
    } else if (/기사님께|뭐라고 말/.test(q)) {
      ai = { role: "ai", text: "기사님이 목적지를 물어보시면 “제2여객터미널이요”라고 말씀하시면 돼요." };
    } else if (/짐은 어디|짐.*싣|요금|카드/.test(q)) {
      ai = { role: "ai", text: "캐리어 2개는 버스 옆 짐칸에 싣고 백팩만 들고 타시면 돼요. 요금은 버스 앞 리더기에 카드를 태깅하면 됩니다." };
    } else if (/(찾았|도착했|확인했|실었|2개예요)/.test(q)) {
      ai = { role: "ai", text: "좋아요, 잘하고 계세요! 준비되면 아래 '다음 단계 보기'로 이어서 안내해드릴게요." };
    } else if (/다시 설명/.test(q)) {
      ai = { role: "ai", text: con.body, btns: con.btns, img: cur };
    } else {
      ai = { role: "ai", text: "공항 이동 여정을 기준으로 도와드릴게요. 지금 단계나 다음 행동, 버스 탑승 중 궁금한 점을 말씀해주세요." };
    }
    setOnTripChat((m) => [...m, { role: "user", text: q }, ai]);
    setOnTripChips(false);
  }

  // 이동 중 대화 로그 렌더 (본문에 삽입)
  function renderOnTripChat() {
    if (onTripChat.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {onTripChat.map((m, i) =>
          m.role === "user" ? (
            <UserBubble key={i}>{m.text}</UserBubble>
          ) : (
            <div key={i}>
              <AIBubble name={false}>{m.text}</AIBubble>
              {m.img && (
                <div style={{ marginTop: 10, marginLeft: 38, maxWidth: 170 }}>
                  <GuideImage src={m.img.img} alt={m.img.alt} kicker={m.img.kicker} />
                </div>
              )}
              {m.btns && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, marginLeft: 38, flexWrap: "wrap" }}>
                  {m.btns.map((b) => (
                    <Chip key={b} onClick={() => askOnTrip(b)}>{b}</Chip>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  // 경로 추천 화면 — 자연어 질문 → 답변(+필요 시 카드)
  function askRoute(input) {
    const q = (input || "").trim();
    if (!q) return;
    let ai;
    if (/도로 정체|막힐|막히|정체/.test(q)) {
      ai = {
        role: "ai",
        text:
          "네, 도로 정체 영향을 줄이고 싶다면 철도 중심 경로를 대안으로 볼 수 있어요.\n\n다만 이 경로는 오송역과 서울역에서 환승이 한 번씩 더 필요해서, 환승 수행 리스크는 높아져요.\n\n짐이 많거나 환승이 익숙하지 않다면 앞서 추천드린 1번 경로가 더 안정적이에요.",
        card: "rail",
      };
    } else if (/버스를 놓|놓치/.test(q)) {
      ai = {
        role: "ai",
        text:
          "아직 가능한 플랜이 있어요.\n\n먼저 다음 6770번 버스가 몇 분 뒤 도착하는지 확인해볼게요. 다음 버스가 곧 도착한다면 광명역에서 대기하는 것이 가장 안정적이에요.\n\n만약 다음 버스까지 시간이 오래 걸리거나 공항 도착 여유 시간이 줄어든다면, 6004번 공항버스 또는 택시 전환을 대안으로 볼 수 있어요.",
        card: "recovery",
      };
    } else if (/환승.*(적|줄)/.test(q)) {
      ai = {
        role: "ai",
        text:
          "환승을 줄이고 싶다면 1번 메인 경로가 환승 2회로 가장 단순해요. 2번도 2회지만 서울역 환승 동선이 길어 체력 부담이 있을 수 있어요. 짐이 2개라면 1번이 가장 부담이 적어요.",
      };
    } else if (/짐.*많|캐리어/.test(q)) {
      ai = {
        role: "ai",
        text:
          "캐리어 2개는 6770번 버스 짐칸에 실을 수 있어요. 환승이 적고 동선이 단순한 1번 경로가 짐 부담이 가장 적어요. 서울역·오송역을 거치는 경로는 환승 시 짐 이동이 늘어요.",
      };
    } else if (/일찍/.test(q)) {
      ai = {
        role: "ai",
        text:
          "도착 여유는 국제선 권장 시간(약 3시간 전)에 맞춰 계산했어요. 너무 일찍 도착하는 게 부담되면 한 편 늦은 KTX로 출발 시간을 조정해드릴 수도 있어요. 다만 여유가 줄어드는 만큼 지연 리스크는 함께 확인할게요.",
      };
    } else {
      ai = {
        role: "ai",
        text:
          "공항 이동 경로와 관련해 도와드릴게요. 경로 안정성, 소요시간, 환승, 버스 놓침 대안 중 궁금한 점을 말씀해주세요.",
      };
    }
    setRouteChat((m) => [...m, { role: "user", text: q }, ai]);
    setRouteChips(false);
  }

  // 경로 카드 아래 채팅 영역 렌더
  function renderRouteChat() {
    if (routeChat.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {routeChat.map((m, i) =>
          m.role === "user" ? (
            <UserBubble key={i}>{m.text}</UserBubble>
          ) : (
            <div key={i}>
              <AIBubble name={false}>{m.text}</AIBubble>
              {m.card === "rail" && (
                <div style={{ marginTop: 12 }}>
                  <RouteCard
                    n={4}
                    tag="철도 중심 대안 경로"
                    compact
                    path="목포 → 오송역 → 서울역 → 공항철도 → 인천공항 T2"
                    risk="상"
                    time="4시간 21분"
                    fare="64,500원"
                    transfers="환승 3회"
                    reason="공항버스 대신 철도 중심으로 이동해 도로 정체 영향을 줄일 수 있어요."
                    caution="오송역과 서울역 환승이 추가되어, 환승 시간이 촉박하거나 짐이 많을 경우 실패 가능성이 높아질 수 있어요."
                  />
                </div>
              )}
              {m.card === "recovery" && (
                <div style={{ marginTop: 12 }}>
                  <RecoveryCard />
                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  /* ----------------------------------------------------------------------
   * 화면별 렌더
   * -------------------------------------------------------------------- */

  /* Screen 1 — 항공권 예매 완료 알림 / 진입 */
  function renderEntry() {
    return (
      <div style={{ padding: "16px 16px 28px", background: "#DCE3F0", minHeight: "100%" }}>
        <div style={{ textAlign: "center", margin: "6px 0 14px" }}>
          <span
            style={{
              background: "#fff",
              color: C.sub,
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 999,
            }}
          >
            2026년 6월 2일 화요일
          </span>
        </div>

        {/* 카카오톡 알림 카드 */}
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: C.navy,
              flexShrink: 0,
            }}
          >
            OZ
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "#4A4D6B", marginBottom: 5, fontWeight: 600 }}>
              아시아나항공
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: "4px 16px 16px 16px",
                overflow: "hidden",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  background: C.yellow,
                  padding: "9px 14px",
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: C.navy,
                }}
              >
                알림톡 도착
              </div>
              <div style={{ padding: "14px 14px 4px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>
                  항공권 예매가 완료되었습니다.
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
                  소중한 고객님의 아시아나항공 이용을 진심으로 감사드립니다.
                </div>
              </div>
              <div style={{ padding: "10px 14px 14px" }}>
                <GuideImage
                  src={IMAGES.ticket}
                  alt="아시아나항공 OZ0108 · 인천(T2) → 시드니 · 2026.06.24 21:00 · 김지현"
                  kicker="예매 완료"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 공항가자 진입 카드 */}
        <div
          style={{
            marginTop: 18,
            background: "#fff",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 8px 22px rgba(41,43,74,0.1)",
            border: `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={44} radius={14} ring />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>공항가자</div>
              <div style={{ fontSize: 11.5, color: C.sub }}>인천공항까지 안전하게 · 카카오T</div>
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: C.navy,
              color: "#fff",
              fontSize: 11.5,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 999,
              marginTop: 12,
            }}
          >
            <span style={{ color: C.yellow }}>✈</span> AI 여정 어시스턴트
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 12, lineHeight: 1.5 }}>
            호주로 여정을 떠나는 지현 님,
            <br />
            인천공항까지는 어떻게 가세요?
          </div>
          <div style={{ fontSize: 13.5, color: C.sub, marginTop: 8, lineHeight: 1.6 }}>
            공항가자 LLM과 함께 인천공항까지의 여정을 준비해봐요.
          </div>
          <div style={{ marginTop: 16 }}>
            <PrimaryBtn tone="yellow" onClick={() => goto("flight")}>
              공항가자로 여정 준비하기
            </PrimaryBtn>
          </div>
        </div>
      </div>
    );
  }

  /* Screen 2 — AI 가이드라인 + 항공편 확인 */
  function renderFlight() {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* AI 가이드라인 */}
        <div
          style={{
            background: C.blueSoft,
            border: `1px solid ${C.blueLine}`,
            borderRadius: 14,
            padding: "13px 14px",
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2C7BD6", marginBottom: 8 }}>
            ⓘ 공항가자 AI 이용 안내
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "공항가자의 답변은 AI가 생성합니다.",
              "같은 질문도 대화 맥락에 따라 다른 답변이 제공될 수 있습니다.",
              "실시간 배차, 지연, 매진, 혼잡도, 터미널 정책은 변경될 수 있어요.",
              "예매, 결제, 탑승 전에는 공식 정보를 함께 확인해주세요.",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#7BA8D8", lineHeight: 1.75, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: "#3C4163", lineHeight: 1.75 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <AIBubble>
          안녕하세요, 지현 님.{"\n"}저는 지현 님을 인천공항까지 안전하게 모실 길잡이 어시스턴트 공항가자 LLM입니다.
          {"\n\n"}6월 24일 수요일, 인천에서 호주 시드니로 가는 아시아나항공 OZ0108편을 확인했어요. 현재 출국일까지 {FLIGHT.daysLeft}일 남았습니다.
          {"\n\n"}지현 님은 어디에서 인천공항으로 출발하시나요?
        </AIBubble>

        <FlightMini />

        <GhostBtn small onClick={() => setOffTopic("ticket")}>
          항공권 정보 다시 보기
        </GhostBtn>
        {offTopic === "ticket" && (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 8, fontWeight: 600 }}>
              아래는 예매 완료 알림 예시예요. 실제 여정 정보는 위 요약 카드를 기준으로 안내해드려요.
            </div>
            <GuideImage src={IMAGES.ticket} alt="OZ0108 예매 완료 알림 예시 — 예약번호 2A6B7C" kicker="예매 알림 예시" />
            <div style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
              예약번호 2A6B7C · 탑승자 {FLIGHT.pax} ({FLIGHT.age}) · {FLIGHT.seat} · 직항 10시간 50분
            </div>
          </div>
        )}

        {/* 출발지 입력 카드 */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 8 }}>
            출발지 입력
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${C.blueLine}`,
              borderRadius: 12,
              padding: "11px 12px",
              background: C.bg,
            }}
          >
            <span style={{ color: C.blue }}>📍</span>
            <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>
              전남 목포시 죽선로 39 근우아트빌
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>
            * 시연용 기본값이 입력되어 있어요.
          </div>
        </div>

        <PrimaryBtn onClick={() => goto("onboarding")}>
          출발지 확인 · 다음으로
        </PrimaryBtn>
      </div>
    );
  }

  /* Screen 3 — 여정 조건 온보딩 */
  function renderOnboarding() {
    const prefs = [
      "비용 절약",
      "이동 시간 최소화",
      "여유로운 도착",
      "환승 최소화",
      "체력 부담 최소화",
      "직접 입력",
    ];
    const fams = ["익숙해요", "조금 헷갈려요", "거의 처음이에요"];
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <AIBubble>
          인천공항까지의 여정 계획을 위해 몇 가지 조건을 확인할게요.{"\n"}많은 정보를 한 번에 입력하지 않아도 괜찮아요. 기본값은 안정성 우선으로 두고, 필요하면 자연어로 조정할 수 있어요.
        </AIBubble>

        {/* 자동 인식된 조건 */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
          <SectionTitle>자동으로 확인한 조건</SectionTitle>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["출발지", "전남 목포시 죽선로 39 근우아트빌"],
              ["동행자", "혼자"],
              ["교통약자", "없음"],
              ["짐", "백팩 1개 + 위탁수하물 캐리어 2개"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 12.5, color: C.faint, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 600, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 이동 성향 */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
          <SectionTitle sub="안정권 경로 안에서 이 선호를 반영해요.">이동 성향을 골라주세요</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {prefs.map((p) => (
              <Chip key={p} active={pref === p} onClick={() => setPref(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {/* 수도권 환승 익숙도 */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
          <SectionTitle sub="익숙하지 않을수록 이동 중 사진 안내를 더 자세히 도와드려요.">
            수도권 환승은 익숙하세요?
          </SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {fams.map((f) => (
              <Chip key={f} active={familiarity === f} onClick={() => setFamiliarity(f)}>
                {f}
              </Chip>
            ))}
          </div>
          {familiarity === "거의 처음이에요" && (
            <div
              style={{
                marginTop: 12,
                background: C.warnSoft,
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 12, color: C.warn, lineHeight: 1.6, fontWeight: 600,
              }}
            >
              📷 환승이 처음이시군요. 이동 중에는 플랫폼·엘리베이터·정류장까지 사진 기반 안내로 한 단계씩 도와드릴게요.
            </div>
          )}
        </div>

        {/* 자연어 추가 입력 */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 8 }}>
            추가로 알려주고 싶은 게 있다면 (선택)
          </div>
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: "11px 12px",
              background: C.bg,
              fontSize: 13,
              color: C.faint,
            }}
          >
            예: 공항에 너무 일찍 가는 건 싫어 / 택시는 피하고 싶어
          </div>
        </div>

        <PrimaryBtn onClick={() => goto("analyzing")}>경로 탐색하기</PrimaryBtn>
      </div>
    );
  }

  /* Screen 4 — 안정성 우선 분석 */
  function renderAnalyzing() {
    const items = [
      "운행 안정성",
      "탑승 확실성",
      "시간 완충성",
      "환승 수행 안정성",
      "대체 경로 가능성",
      "외부 변수 민감도",
    ];
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <AIBubble>
          먼저 실패 가능성이 높은 경로를 제외하고 있어요.{"\n"}이후 남은 안정권 경로 안에서 지현 님의 선호인 “{pref}”를 반영할게요.
        </AIBubble>

        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <Logo size={38} radius={12} />
              <div
                style={{
                  position: "absolute", inset: -4, borderRadius: 16,
                  border: `2px solid ${C.blueLine}`, borderTopColor: C.blue,
                  animation: "ghspin 0.9s linear infinite",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>
                공항가자가 안정성 기준으로 경로를 살펴보고 있어요
              </div>
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>안정성 항목 점검 중…</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it, i) => {
              const done = analyzeStep > i;
              return (
                <div
                  key={it}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    opacity: analyzeStep >= i ? 1 : 0.4,
                    transition: "opacity .3s",
                  }}
                >
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                      background: done ? C.ok : C.bg,
                      border: done ? "none" : `1px solid ${C.line}`,
                      color: "#fff", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 12, fontWeight: 800,
                      transition: "background .3s",
                    }}
                  >
                    {done ? "✓" : ""}
                  </div>
                  <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{it}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: done ? C.ok : C.faint, fontWeight: 700 }}>
                    {done ? "확인" : "대기"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* Screen 5/6/7 — 경로 비교 + 후속질문 + 버스놓침 */
  function renderRoutes() {
    return (
      <div style={{ padding: 16, paddingBottom: 8, display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionTitle>경로 추천 결과</SectionTitle>
        <AIBubble>
          지현 님의 조건을 기준으로 실패 가능성이 높은 경로를 먼저 제외했어요.{"\n"}그다음 남은 안정권 경로 안에서 “{pref}” 선호를 반영했어요.
        </AIBubble>

        {/* 경로 카드 1 — 정보만 */}
        <RouteCard
          n={1}
          tag="메인 추천 경로"
          recommend
          selected={selectedRoute === 1}
          onSelect={() => setSelectedRoute(1)}
          path="목포 → 광명역 → 6770 공항버스 → 인천공항 T2"
          risk="최상"
          time="3시간 59분"
          fare="68,600원"
          transfers="환승 2회"
          reason="이동 시간이 가장 짧고, 광명역에서 인천공항까지 연결이 비교적 단순해요."
          caution="6770번 공항버스는 사전 좌석 예매가 아닌 선착순 탑승이에요. 버스를 놓쳤을 때의 대안을 함께 확인해두는 것이 좋아요."
        />

        {/* 경로 카드 2 */}
        <RouteCard
          n={2}
          tag="안정형 대안 경로"
          selected={selectedRoute === 2}
          onSelect={() => setSelectedRoute(2)}
          path="목포 → 서울역 → 공항철도 → 인천공항 T2"
          risk="상"
          time="4시간 42분"
          fare="60,050원"
          transfers="환승 2회"
          reason="철도 중심이라 도로 정체 영향을 덜 받아요."
          caution="서울역 환승 동선이 길고, 짐이 많으면 체력 부담이 있을 수 있어요."
        />

        {/* 경로 카드 3 */}
        <RouteCard
          n={3}
          tag="조건부 대안 경로"
          selected={selectedRoute === 3}
          onSelect={() => setSelectedRoute(3)}
          path="목포 → 수서역 → 공항버스 → 인천공항 T2"
          risk="중"
          time="4시간 36분"
          fare="63,700원"
          transfers="환승 2회"
          reason="특정 시간대에는 빠르게 이동할 수 있어요."
          caution="수서역 이후 공항버스는 도로 상황 영향을 받을 수 있어요."
        />

        {/* 구분선 + 채팅 유도 */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.6 }}>
            궁금한 점은 아래 채팅창에 자연어로 물어보세요.{"\n"}예: “버스를 놓치면 어떻게 해?”, “도로 정체가 걱정돼”
          </div>
        </div>

        {/* 카드 아래 독립 채팅 영역 */}
        {renderRouteChat()}

        <PrimaryBtn tone="yellow" onClick={() => goto("booking")}>
          {selectedRoute}번 경로로 진행하기
        </PrimaryBtn>
      </div>
    );
  }

  /* Screen 8 — 경로 확정 / 예매 */
  function renderBooking() {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <UserBubble>그럼 {selectedRoute}번 경로로 갈래.</UserBubble>
        <AIBubble>
          네, 그럼 {selectedRoute}번 경로로 여정을 저장할게요.{"\n"}KTX 예매와 이동 알림 설정을 이어서 도와드릴 수 있어요.
        </AIBubble>

        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
          <SectionTitle sub="실제 결제는 일어나지 않는 시연용 카드예요.">예매 / 발권 준비</SectionTitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["🚄", "KTX 목포역 → 광명역", "06.24 (수) · 일반실 1석"],
              ["🚌", "6770번 공항버스 탑승 안내", "선착순 탑승 · 광명역 4번 출구"],
              ["🔔", "이동 중 알림 설정", "거점 도착 30분 전 선제 안내"],
            ].map(([ic, t, d]) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", background: C.bg, borderRadius: 12, padding: "11px 12px" }}>
                <span style={{ fontSize: 18 }}>{ic}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{t}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!booked ? (
          <PrimaryBtn tone="yellow" onClick={() => setConfirmOpen(true)}>
            바로 예매 및 발권 진행하기
          </PrimaryBtn>
        ) : (
          <div style={{ background: C.okSoft, border: `1px solid ${C.ok}33`, borderRadius: 14, padding: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ok }}>예매가 완료되었습니다</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>여정 타임라인에 저장했어요.</div>
            </div>
          </div>
        )}

        <GhostBtn onClick={() => goto("timeline")}>여정 타임라인 보기</GhostBtn>
        <GhostBtn small onClick={() => goto("timeline")}>출발 전 체크리스트 보기</GhostBtn>

        {/* 재확인 모달 */}
        {confirmOpen && (
          <Modal onClose={() => setConfirmOpen(false)}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>예매 전 확인</div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.6 }}>
              되돌리기 어려운 결제 전, 아래 내용을 확인해주세요.
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["예상 비용", "68,600원"],
                ["예상 소요시간", "3시간 59분"],
                ["기존 계획 영향", "변경 없음 (메인 경로 유지)"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, color: C.faint }}>{k}</span>
                  <span style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
              * 실시간 좌석·요금은 공식 예매처에서 최종 확인이 필요해요.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <GhostBtn small onClick={() => setConfirmOpen(false)}>다시 볼게요</GhostBtn>
              </div>
              <div style={{ flex: 1 }}>
                <PrimaryBtn small tone="navy" onClick={() => { setBooked(true); setConfirmOpen(false); }}>
                  예매 진행
                </PrimaryBtn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  /* Screen 9 — 전체 여정 타임라인 + 체크리스트 */
  function renderTimeline() {
    const steps = [
      ["집 출발", "근우아트빌", "완료", "최상"],
      ["시내버스 탑승", "홍일중학교 정류장", "완료", "상"],
      ["목포역 도착", "KT목포빌딩 경유", "완료", "최상"],
      ["KTX 탑승", "목포역 → 광명역", "현재", "최상"],
      ["광명역 도착", "4번 출구 이동", "예정", "최상"],
      ["6770 공항버스 탑승", "선착순 · 핵심 구간", "예정", "중"],
      ["인천공항 T2 3층 도착", "체크인 카운터 이동", "예정", "상"],
      ["수하물 위탁 · 보안검색", "출국 절차", "예정", "상"],
    ];
    const list = [
      "여권", "항공권", "모바일 탑승권", "캐리어 2개",
      "백팩", "보조배터리", "환전/카드", "출국 전 체크인",
    ];
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle sub="전체 여정을 외우지 않아도 돼요. 단계별로 저장해뒀어요.">전체 여정 타임라인</SectionTitle>

        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "8px 14px 14px" }}>
          {steps.map((s, i) => {
            const [t, d, st, risk] = s;
            const isNow = st === "현재";
            const isDone = st === "완료";
            const color = isNow ? C.blue : isDone ? C.ok : C.faint;
            return (
              <div key={i} style={{ display: "flex", gap: 12, paddingTop: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 14, height: 14, borderRadius: 999,
                      background: isDone ? C.ok : isNow ? C.blue : "#fff",
                      border: `2px solid ${color}`, flexShrink: 0, marginTop: 3,
                      boxShadow: isNow ? `0 0 0 4px ${C.blueSoft}` : "none",
                    }}
                  />
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: C.line, marginTop: 3, minHeight: 22 }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: isNow ? C.blue : C.ink }}>{t}</span>
                    {st === "현재" && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: C.blue, padding: "2px 7px", borderRadius: 999 }}>지금</span>
                    )}
                    {(t.includes("6770")) && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: C.navy, background: C.yellow, padding: "2px 7px", borderRadius: 999 }}>핵심 구간</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{d}</div>
                  <div style={{ marginTop: 5 }}><RiskBadge level={risk} /></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 체크리스트 */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}>
          <SectionTitle>출발 전 체크리스트</SectionTitle>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {list.map((item) => {
              const on = !!checked[item];
              return (
                <button
                  key={item}
                  onClick={() => setChecked((c) => ({ ...c, [item]: !c[item] }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                    border: `1px solid ${on ? C.ok : C.line}`,
                    background: on ? C.okSoft : "#fff",
                    borderRadius: 12, padding: "10px 11px", cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  <span
                    style={{
                      width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                      background: on ? C.ok : "#fff", border: `1.5px solid ${on ? C.ok : C.line}`,
                      color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
                    }}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        <PrimaryBtn tone="blue" onClick={() => goto("alert", "on")}>
          이동 중 안내 보기 →
        </PrimaryBtn>
      </div>
    );
  }

  /* Screen 10 — 이동 중 / 광명역 도착 30분 전 */
  function renderAlert() {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            background: C.navy, color: "#fff", borderRadius: 14, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🔔</span>
          <div>
            <div style={{ fontSize: 11.5, color: C.yellow, fontWeight: 700 }}>먼저 챙겨드릴게요</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>광명역 도착까지 약 30분</div>
          </div>
        </div>

        <AIBubble>
          지현 님, 광명역 도착까지 약 30분 남았어요.{"\n"}도착 후 바로 6770번 공항버스로 환승할 수 있도록 광명역 안에서 이동해야 할 길을 미리 안내해드릴게요.
        </AIBubble>

        <UserBubble>나 이제 광명역 거의 도착해. 내리면 어디로 가야 해?</UserBubble>

        <AIBubble>
          좋아요, 지현 님. 광명역에 내리면 바로 6770번 공항버스 정류장으로 이동하면 돼요.
          {"\n\n"}먼저 플랫폼에서 호차번호 안내를 보고 10호차 위치 쪽으로 이동해주세요. 캐리어가 2개 있으니 계단보다 엘리베이터를 이용하는 편이 안전해요.
          {"\n\n"}제가 사진과 함께 한 단계씩 안내해드릴게요.
        </AIBubble>

        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 12 }}>
          <GuideImage src={IMAGES.platform} alt="KTX 광명역 플랫폼 — 호차번호 안내 전광판" kicker="광명역 플랫폼" />
        </div>

        {/* 상황 선택 — 사용자가 답하듯 */}
        {ktxDelayed === null && (
          <div>
            <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 6, textAlign: "right" }}>
              지금 상황을 골라 답해보세요
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Chip onClick={() => setKtxDelayed("ontime")}>예정대로 도착해요</Chip>
              <Chip onClick={() => setKtxDelayed("delay")}>KTX가 20분 지연됐어</Chip>
            </div>
          </div>
        )}

        {ktxDelayed === "delay" && (
          <>
            <UserBubble>아니ㅠㅠ KTX가 20분 지연됐어.</UserBubble>
            <AIBubble>
              괜찮아요, 지현 님.{"\n"}바뀐 광명역 도착 시간 기준으로 다시 계산해볼게요.
              {"\n\n"}광명역 도착이 예정보다 20분 늦어졌지만, 인천공항 도착까지 아직 여유가 있고 다음 6770번 버스가 있어서 기존 경로를 유지하는 것이 가장 안정적이에요.
              {"\n\n"}기존 경로대로 안내드릴게요.
            </AIBubble>
          </>
        )}

        {ktxDelayed === "ontime" && (
          <>
            <UserBubble>응, 예정대로 도착해.</UserBubble>
            <AIBubble>
              좋아요, 예정대로 도착해요.{"\n"}그대로 6770번 공항버스 환승 동선을 사진으로 안내해드릴게요.
            </AIBubble>
          </>
        )}

        {/* 추가 자연어 질문 */}
        {ktxDelayed !== null && alertChat === 0 && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Chip onClick={() => setAlertChat(1)}>지금 어디로 가야 하는지 조금 헷갈려</Chip>
          </div>
        )}
        {alertChat >= 1 && (
          <>
            <UserBubble>지금 어디로 가야 하는지 조금 헷갈려.</UserBubble>
            <AIBubble>
              괜찮아요. 지금 단계만 다시 천천히 볼게요.
              {"\n\n"}현재는 광명역 플랫폼에서 1층으로 내려가는 단계예요. 플랫폼의 호차번호 안내에서 10이라고 적힌 위치를 찾아가면 엘리베이터가 있어요.
              {"\n\n"}캐리어가 2개 있으니 엘리베이터를 타고 1층으로 이동해주세요.
            </AIBubble>
          </>
        )}

        {renderOnTripChat()}

        {ktxDelayed !== null && (
          <PrimaryBtn tone="blue" onClick={() => { setPhotoStep(0); setOnTripChat([]); goto("photo"); }}>
            사진으로 환승 동선 보기 →
          </PrimaryBtn>
        )}
      </div>
    );
  }

  /* Screen 11/12 — 사진 기반 환승 시뮬레이션 + 도착 */
  function renderPhoto() {
    const cur = PHOTO_STEPS[photoStep];
    const last = photoStep === PHOTO_STEPS.length - 1;
    const goStep = (d) => {
      setOnTripChat([]);
      setPhotoStep((s) => s + d);
    };

    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 진행 막대 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>남은 환승 여정</span>
            <span style={{ fontSize: 11.5, color: C.faint }}>도보 1분 · 버스 65분 · 도보 1분</span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[
              { label: "광명역", w: 0.8 },
              { label: "도보", w: 0.5 },
              { label: "6770", w: 3 },
              { label: "T2", w: 0.5 },
            ].map((seg, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    flex: seg.w, height: 8, borderRadius: 999,
                    background: i <= Math.min(2, Math.floor(photoStep / 2)) ? C.blue : C.blueLine,
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 단계 위젯 */}
        <div style={{ background: C.navy, borderRadius: 12, padding: "10px 13px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: C.yellow, fontWeight: 700 }}>지금 할 일</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 1 }}>{cur.title}</div>
          </div>
          <span style={{ fontSize: 12, color: "#B9BEDD" }}>{photoStep + 1} / {PHOTO_STEPS.length}</span>
        </div>

        {/* 사진 카드 (한 카드 한 행동) */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}>
          <GuideImage src={cur.img} alt={cur.alt} kicker={cur.kicker} />
          <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginTop: 12 }}>{cur.kicker}</div>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: C.ink, marginTop: 4 }}>{cur.title}</div>
          <div style={{ fontSize: 13.5, color: C.sub, marginTop: 8, lineHeight: 1.7 }}>{cur.body}</div>
        </div>

        {/* 카드 아래 대화 영역 (하단 채팅 입력창에서 질문 시 이어짐) */}
        {renderOnTripChat()}

        {/* 진행 버튼 — 주 CTA + 보조 */}
        <div style={{ display: "flex", gap: 8 }}>
          {photoStep > 0 && (
            <div style={{ flex: 1 }}>
              <GhostBtn onClick={() => goStep(-1)}>이전</GhostBtn>
            </div>
          )}
          <div style={{ flex: 2 }}>
            {!last ? (
              <PrimaryBtn tone="blue" onClick={() => goStep(1)}>다음 단계 보기</PrimaryBtn>
            ) : (
              <PrimaryBtn tone="yellow" onClick={() => goto("arrival")}>인천공항 도착 →</PrimaryBtn>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <GhostBtn small onClick={() => askOnTrip("사진 다시 보여줘")}>사진 다시 보기</GhostBtn>
          </div>
          <div style={{ flex: 1 }}>
            <GhostBtn small onClick={() => goto("timeline", "pre")}>전체 여정 보기</GhostBtn>
          </div>
        </div>
      </div>
    );
  }

  /* Screen 12 — 인천공항 T2 도착 */
  function renderArrival() {
    const items = ["캐리어 1 확인", "캐리어 2 확인", "백팩 확인"];
    const allChecked = items.every((i) => arrivalCheck[i]);
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}>
          <GuideImage src={IMAGES.airportExterior} alt="인천공항 제2여객터미널 외부 — 공항버스 하차장" kicker="인천공항 T2 도착" />
        </div>

        <AIBubble>
          약 1시간 15분 후 인천공항 제2여객터미널 3층에 도착할 예정이에요.{"\n"}도착하면 기사님이 실어둔 캐리어를 꺼내주실 거예요.
          {"\n\n"}캐리어 2개를 모두 챙겼는지 확인해주세요.
        </AIBubble>

        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}>
          <SectionTitle>짐 확인</SectionTitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((it) => {
              const on = !!arrivalCheck[it];
              return (
                <button
                  key={it}
                  onClick={() => setArrivalCheck((c) => ({ ...c, [it]: !c[it] }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    border: `1px solid ${on ? C.ok : C.line}`, background: on ? C.okSoft : "#fff",
                    borderRadius: 12, padding: "12px 13px", cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  <span
                    style={{
                      width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                      background: on ? C.ok : "#fff", border: `1.5px solid ${on ? C.ok : C.line}`,
                      color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
                    }}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{it}</span>
                </button>
              );
            })}
          </div>
        </div>

        {renderOnTripChat()}

        <PrimaryBtn tone={allChecked ? "yellow" : "navy"} onClick={() => goto("checkin")}>
          체크인 카운터 안내 보기
        </PrimaryBtn>
      </div>
    );
  }

  /* Screen 13 — T2 내부 / 체크인 안내 + 마무리 */
  function renderCheckin() {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}>
          <GuideImage src={IMAGES.airportInterior} alt="인천공항 T2 내부 — 체크인 카운터 구역 안내 (C/D/E/F/G)" kicker="T2 내부 · 체크인 구역" />
        </div>

        <AIBubble>
          인천공항 T2에 무사히 도착했어요.{"\n"}이제 아시아나항공 체크인 카운터 방향으로 이동하면 됩니다.
          {"\n\n"}위탁수하물 캐리어 2개가 있으니, 체크인 카운터에서 수하물을 먼저 맡기는 걸 추천드려요.
        </AIBubble>

        <div style={{ background: C.blueSoft, border: `1px solid ${C.blueLine}`, borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#3C4163", lineHeight: 1.6 }}>
          체크인 카운터 위치와 마감 시간은 당일 운영 상황에 따라 달라질 수 있어요. 현장 전광판에서 한 번 더 확인해주세요.
        </div>

        <UserBubble>응! 공항가자 덕분에 무사히 잘 도착했어.</UserBubble>
        <AIBubble>
          도움이 될 수 있어 다행이에요.{"\n"}남은 출국 절차도 안전하게 마치실 수 있도록 필요한 순간에 다시 안내해드릴게요.
        </AIBubble>

        {renderOnTripChat()}

        <GhostBtn onClick={() => { setScreen("entry"); setTab("pre"); }}>처음부터 다시 보기</GhostBtn>
      </div>
    );
  }

  /* ----------------------------------------------------------------------
   * 채팅 입력 영역 (추천 칩 / + 메뉴 / 목적 외 응답)
   * -------------------------------------------------------------------- */

  /* ----------------------------------------------------------------------
   * 렌더 라우팅
   * -------------------------------------------------------------------- */
  function renderScreen() {
    switch (screen) {
      case "entry": return renderEntry();
      case "flight": return renderFlight();
      case "onboarding": return renderOnboarding();
      case "analyzing": return renderAnalyzing();
      case "routes": return renderRoutes();
      case "booking": return renderBooking();
      case "timeline": return renderTimeline();
      case "alert": return renderAlert();
      case "photo": return renderPhoto();
      case "arrival": return renderArrival();
      case "checkin": return renderCheckin();
      default: return renderEntry();
    }
  }

  const hideTopBar = screen === "entry";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#E4E8F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 12px",
        fontFamily: FONT,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes ghspin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      {/* 폰 프레임 */}
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          height: "min(844px, 92vh)",
          background: C.bg,
          borderRadius: 30,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(20,22,45,0.28)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* 상태바 */}
        <div
          style={{
            height: 34,
            background: hideTopBar ? "#DCE3F0" : C.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: hideTopBar ? C.navy : "#fff" }}>9:41</span>
          <span style={{ fontSize: 11, color: hideTopBar ? C.navy : "#fff" }}>● ● ●</span>
        </div>

        {/* 탑바 */}
        {!hideTopBar && (
          <div
            style={{
              background: C.navy,
              color: "#fff",
              padding: "6px 16px 12px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={30} radius={9} ring />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>공항가자</div>
                <div style={{ fontSize: 10.5, color: "#B9BEDD" }}>인천공항까지 안전하게</div>
              </div>
            </div>

            {/* 이동 전 / 이동 중 탭 */}
            <div
              style={{
                marginTop: 12, display: "flex", background: "#1F2140",
                borderRadius: 999, padding: 3,
              }}
            >
              {[
                ["pre", "이동 전"],
                ["on", "이동 중"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => switchTab(k)}
                  style={{
                    flex: 1, border: "none", cursor: "pointer", fontFamily: FONT,
                    background: tab === k ? "#fff" : "transparent",
                    color: tab === k ? C.navy : "#9AA0C8",
                    fontSize: 12.5, fontWeight: 800, padding: "8px 0", borderRadius: 999,
                    transition: "all .2s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 본문 */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {renderScreen()}
        </div>

        {/* 경로 추천 화면 — 하단 고정 채팅 입력창 */}
        {tab === "pre" && screen === "routes" && (
          <ChatInputBar
            chips={routeChips}
            setChips={setRouteChips}
            onSend={askRoute}
            onOpenSheet={() => setOnTripSheet(true)}
            placeholder="공항가자에게 물어보기..."
            suggestions={[
              "버스를 놓치면 어떻게 해?",
              "도로 정체가 걱정돼",
              "환승이 적은 대안 있어?",
              "짐이 많아도 괜찮아?",
              "공항에 너무 일찍 가긴 싫어",
            ]}
          />
        )}

        {/* 이동 중 — 하단 고정 채팅 입력창 */}
        {tab === "on" && (
          <ChatInputBar
            chips={onTripChips}
            setChips={setOnTripChips}
            onSend={askOnTrip}
            onOpenSheet={() => setOnTripSheet(true)}
            placeholder="지금 상황을 자연어로 말해보세요"
            suggestions={[
              "지금 어디로 가야 해?",
              "헷갈려요",
              "엘리베이터가 안 보여요",
              "버스를 놓쳤어요",
              "사진 다시 보여줘",
            ]}
          />
        )}

        {/* + 빠른 기능 바텀시트 (공용) */}
        {onTripSheet && (
          <QuickSheet
            onClose={() => setOnTripSheet(false)}
            onPick={(label) => {
              setOnTripSheet(false);
              if (label === "경로 다시 비교") goto("routes", "pre");
              else if (label === "전체 여정 보기") goto("timeline", "pre");
              else if (label === "체크리스트 보기") goto("timeline", "pre");
              else if (label === "예매 내역 보기") goto("booking", "pre");
              else if (label === "지금 위치 기준 재탐색") {
                if (tab === "on") askOnTrip("지금 위치 기준으로 다시 봐줘");
                else goto("alert", "on");
              } else if (label === "버스를 놓쳤어요") {
                if (tab === "on") askOnTrip("6770번 버스를 놓친 것 같아요.");
                else askRoute("버스를 놓치면 어떻게 해?");
              }
            }}
          />
        )}

        {/* 하단 단계 네비게이션 */}
        <BottomNav screen={screen} tab={tab} goto={goto} switchTab={switchTab} />
      </div>
    </div>
  );
}

/* ---------------- 이동 중 채팅 패널 ---------------- */
/* ---------------- 이동 중 하단 고정 채팅 입력창 ---------------- */
function ChatInputBar({ chips, setChips, onSend, onOpenSheet, suggestions = [], placeholder = "공항가자에게 물어보기..." }) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, background: "#fff" }}>
      {chips && suggestions.length > 0 && (
        <div style={{ padding: "10px 12px 4px", display: "flex", gap: 8, overflowX: "auto" }}>
          {suggestions.map((s) => (
            <Chip key={s} onClick={() => onSend(s)}>{s}</Chip>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
        <button
          onClick={onOpenSheet}
          style={{
            width: 36, height: 36, borderRadius: 999, border: "none", flexShrink: 0,
            background: C.bg, color: C.navy, fontSize: 20, fontWeight: 700, cursor: "pointer", lineHeight: 1,
          }}
        >
          +
        </button>
        <div
          onClick={() => setChips((v) => !v)}
          style={{
            flex: 1, background: C.bg, borderRadius: 999, padding: "10px 14px",
            fontSize: 13, color: C.faint, cursor: "text",
          }}
        >
          {placeholder}
        </div>
        <button
          onClick={() => setChips((v) => !v)}
          style={{
            width: 38, height: 38, borderRadius: 999, border: "none", flexShrink: 0,
            background: C.blue, color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="전송"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

/* ---------------- + 빠른 기능 바텀시트 ---------------- */
function QuickSheet({ onClose, onPick }) {
  const items = [
    ["🔀", "경로 다시 비교"],
    ["🗺", "전체 여정 보기"],
    ["✅", "체크리스트 보기"],
    ["🧾", "예매 내역 보기"],
    ["📍", "지금 위치 기준 재탐색"],
    ["🚌", "버스를 놓쳤어요"],
  ];
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, background: "rgba(20,22,45,0.4)",
        zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "20px 20px 0 0", padding: "10px 14px 18px",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 999, background: C.line, margin: "4px auto 12px" }} />
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 10 }}>빠른 기능</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {items.map(([ic, label]) => (
            <button
              key={label}
              onClick={() => onPick(label)}
              style={{
                display: "flex", alignItems: "center", gap: 9, textAlign: "left",
                border: `1px solid ${C.line}`, background: "#fff", borderRadius: 12,
                padding: "12px 12px", cursor: "pointer", fontFamily: FONT,
              }}
            >
              <span style={{ fontSize: 17 }}>{ic}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 경로 카드 ---------------- */
function RouteCard({
  n, tag, recommend, selected, onSelect, path, risk, time, fare, transfers,
  reason, caution, compact,
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: "#fff",
        border: `2px solid ${selected ? C.blue : C.line}`,
        borderRadius: 16,
        padding: 15,
        cursor: onSelect ? "pointer" : "default",
        boxShadow: selected ? "0 10px 24px rgba(98,182,255,0.22)" : "0 4px 12px rgba(0,0,0,0.04)",
        transition: "all .2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            width: 22, height: 22, borderRadius: 7, background: selected ? C.blue : C.navy,
            color: "#fff", fontSize: 12.5, fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          {n}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{tag}</span>
        {recommend && (
          <span
            style={{
              fontSize: 10.5, fontWeight: 800, color: C.navy, background: C.yellow,
              padding: "2px 8px", borderRadius: 999,
            }}
          >
            ★ AI 추천
          </span>
        )}
        {selected && (
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: C.blue }}>✓ 선택됨</span>
        )}
      </div>

      <div style={{ fontSize: 13, color: C.sub, marginTop: 10, lineHeight: 1.5, fontWeight: 600 }}>
        {path}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <RiskBadge level={risk} />
        <span style={tagStyle}>⏱ {time}</span>
        <span style={tagStyle}>💳 {fare}</span>
        <span style={tagStyle}>🔁 {transfers}</span>
      </div>

      {!compact && (
        <>
          <div style={{ marginTop: 13, background: C.okSoft, borderRadius: 10, padding: "9px 11px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.ok, marginBottom: 3 }}>추천 이유</div>
            <div style={{ fontSize: 12.5, color: "#2E5E51", lineHeight: 1.5 }}>{reason}</div>
          </div>
          <div style={{ marginTop: 8, background: C.warnSoft, borderRadius: 10, padding: "9px 11px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.warn, marginBottom: 3 }}>주의할 점</div>
            <div style={{ fontSize: 12.5, color: "#7A5A14", lineHeight: 1.5 }}>{caution}</div>
          </div>
        </>
      )}

      {compact && (
        <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
            <b style={{ color: C.ok }}>추천 </b>{reason}
          </div>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
            <b style={{ color: C.warn }}>주의 </b>{caution}
          </div>
        </div>
      )}

      {!compact && onSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{
            width: "100%", marginTop: 13, border: "none", cursor: "pointer", fontFamily: FONT,
            background: selected ? C.navy : C.bg, color: selected ? "#fff" : C.navy,
            fontSize: 13.5, fontWeight: 800, padding: "11px 0", borderRadius: 12,
          }}
        >
          {selected ? "✓ 선택한 경로" : "이 경로 선택하기"}
        </button>
      )}
    </div>
  );
}

/* 복구 플랜 카드 (채팅 답변 아래 보조 카드) */
function RecoveryCard() {
  const opts = [
    ["⏱", "다음 6770 대기", "다음 버스가 곧 도착하면 가장 안정적"],
    ["🚌", "6004번 공항버스 대안", "6번 출구 방향 · 도로 상황 영향 있음"],
    ["🚕", "택시 전환", "여유가 많이 줄었을 때 도착 가능성 ↑"],
  ];
  return (
    <div style={{ background: C.blueSoft, border: `1px solid ${C.blueLine}`, borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#2C7BD6", marginBottom: 10 }}>복구 플랜</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map(([ic, t, d]) => (
          <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", background: "#fff", borderRadius: 11, padding: "10px 12px" }}>
            <span style={{ fontSize: 16 }}>{ic}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{t}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
        실시간 도착 시간은 변동될 수 있어요. 탑승 전 예상 도착 시간과 공항 도착 여유를 함께 확인해주세요.
      </div>
    </div>
  );
}

const tagStyle = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "#4A4D6B",
  background: "#F2F4FA",
  padding: "3px 9px",
  borderRadius: 999,
};

/* ---------------- 모달 ---------------- */
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, background: "rgba(20,22,45,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 50, padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360, background: "#fff", borderRadius: 20,
          padding: 18, boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- 하단 네비 (단계 이동) ---------------- */
function BottomNav({ screen, tab, goto, switchTab }) {
  // 탭별 순서
  const flow = tab === "pre"
    ? ["entry", "flight", "onboarding", "analyzing", "routes", "booking", "timeline"]
    : ["alert", "photo", "arrival", "checkin"];
  const idx = flow.indexOf(screen);

  const labels = {
    entry: "진입", flight: "항공편", onboarding: "조건", analyzing: "분석",
    routes: "경로", booking: "예매", timeline: "타임라인",
    alert: "출발 안내", photo: "사진 환승", arrival: "공항 도착", checkin: "체크인",
  };

  return (
    <div
      style={{
        borderTop: `1px solid ${C.line}`,
        background: "#fff",
        padding: "8px 12px",
        paddingBottom: 12,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <button
        onClick={() => idx > 0 && goto(flow[idx - 1])}
        disabled={idx <= 0}
        style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.line}`,
          background: "#fff", color: idx <= 0 ? C.faint : C.navy, fontSize: 16,
          cursor: idx <= 0 ? "default" : "pointer", flexShrink: 0,
        }}
      >
        ‹
      </button>

      <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center", overflowX: "auto" }}>
        {flow.map((s, i) => (
          <div
            key={s}
            onClick={() => goto(s)}
            style={{
              flex: 1, minWidth: 0, cursor: "pointer", textAlign: "center",
            }}
          >
            <div
              style={{
                height: 4, borderRadius: 999,
                background: i <= idx ? C.blue : C.line,
                marginBottom: 3,
              }}
            />
            <div
              style={{
                fontSize: 9.5, fontWeight: i === idx ? 800 : 600,
                color: i === idx ? C.blue : C.faint, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {labels[s]}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => idx < flow.length - 1 && goto(flow[idx + 1])}
        disabled={idx >= flow.length - 1}
        style={{
          width: 40, height: 40, borderRadius: 12, border: "none",
          background: idx >= flow.length - 1 ? C.line : C.navy,
          color: "#fff", fontSize: 16,
          cursor: idx >= flow.length - 1 ? "default" : "pointer", flexShrink: 0,
        }}
      >
        ›
      </button>
    </div>
  );
}
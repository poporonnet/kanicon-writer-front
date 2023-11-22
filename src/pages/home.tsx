import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormLabel,
  Radio,
  radioClasses,
  RadioGroup,
  Sheet,
} from "@mui/joy";
import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Input,
  Typography,
} from "@mui/material";
import {
  Flag as FlagIcon,
  Usb as UsbIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  Check as CheckIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import Ansi from "ansi-to-react";
import Base64 from "base64-js";

import { MrubyWriterConnector, Target } from "libs/mrubyWriterConnector";
import { isTarget } from "libs/utility";
import { useQuery } from "hooks/useQuery";
import { compiler } from "libs/axios";
import RBoard from "/Rboard.png";
import ESP32 from "/ESP32.png";
import "css/home.css";

const targets = [
  {
    title: "RBoard",
    image: RBoard,
  },
  {
    title: "ESP32",
    image: ESP32,
  },
] as const satisfies readonly { title: Target; image: string }[];

type CompileStatus = {
  status: "idle" | "compile" | "success" | "error";
  error?: string;
};

export const Home = () => {
  const query = useQuery();
  const id = query.get("id");

  const targetItem = localStorage.getItem("target");
  const [target, setTarget] = useState<Target>(
    isTarget(targetItem) ? targetItem : "RBoard"
  );
  const autoConnectItem = localStorage.getItem("autoConnect");
  const [autoConnectMode, setAutoConnectMode] = useState<boolean>(
    autoConnectItem === "true"
  );

  const [connector] = useState<MrubyWriterConnector>(
    new MrubyWriterConnector({
      target,
      log: (message, params) => console.log(message, params),
      onListen: (buffer) => setLog([...buffer]),
      useAnsi: true,
    })
  );
  const [command, setCommand] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [code, setCode] = useState<Uint8Array>();
  const [compileStatus, setCompileStatus] = useState<CompileStatus>({
    status: "idle",
  });

  useEffect(() => {
    const compile = async () => {
      setCompileStatus({ status: "idle" });

      const code = await compiler
        .get(`/code/${id}`)
        .then((res) => res.data as { code: string })
        .catch(() => undefined);
      if (!code) {
        setCompileStatus({
          status: "error",
          error: "No source code found.",
        });
        return;
      }

      setCompileStatus({ status: "compile" });

      compiler
        .post(`/code/${id}/compile`)
        .then((res) => {
          const result = res.data as { binary: string; error: string };
          if (result.error !== "") return;

          setCode(Base64.toByteArray(result.binary));
          setCompileStatus({ status: "success" });
        })
        .catch(() =>
          setCompileStatus({ status: "error", error: "Compile failed." })
        );
    };

    compile();
  }, []);

  useEffect(() => {
    if (!autoConnectMode) return;

    const autoConnect = async () => {
      const ports = await navigator.serial.getPorts();
      if (ports.length == 0) return;

      connector
        .connect(async () => ports[0])
        .then((result) => {
          if (result.isFailure()) {
            console.log(result);
            return;
          }

          read();
        });
    };

    autoConnect();
  }, []);

  const connect = async () => {
    const res = await connector.connect(
      async () => await navigator.serial.requestPort()
    );
    if (res.isFailure()) {
      alert(`ポートを取得できませんでした。\n${res.error}`);
      console.log(res);
      return;
    }
    await read();
  };

  const read = async () => {
    const res = await connector.startListen();
    console.log(res);
    if (res.isFailure()) {
      alert(
        `受信中にエラーが発生しました。\n${res.error}\ncause: ${res.error.cause}`
      );
    }
  };

  const send = async (text: string) => {
    const res = await connector.sendCommand(text);
    console.log(res);
    if (res.isFailure()) {
      alert(
        `送信中にエラーが発生しました。\n${res.error}\ncause: ${res.error.cause}`
      );
    }
  };

  const writeCode = async () => {
    if (!code) return;
    const res = await connector.writeCode(code);
    console.log(res);
    if (res.isFailure()) {
      alert(
        `書き込み中にエラーが発生しました。\n${res.error}\ncause: ${res.error.cause}`
      );
    }
  };

  return (
    <Box id="home">
      <Typography
        variant="h4"
        component="div"
        color="black"
        fontFamily={"'M PLUS Rounded 1c', sans-serif"}
      >
        書き込みツール
      </Typography>

      <CompileStatusCard status={compileStatus} />

      {/* マイコン選択 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <RadioGroup
          aria-label="platform"
          defaultValue="Website"
          overlay
          name="platform"
          sx={{
            flexDirection: "row",
            margin: "2rem auto",
            gap: 2,
            [`& .${radioClasses.checked}`]: {
              [`& .${radioClasses.action}`]: {
                inset: -1,
                border: "3px solid",
                borderColor: "primary.500",
              },
            },
            [`& .${radioClasses.radio}`]: {
              display: "contents",
              "& > svg": {
                zIndex: 2,
                position: "absolute",
                top: "-8px",
                right: "-8px",
                bgcolor: "background.surface",
                borderRadius: "50%",
              },
            },
          }}
        >
          {targets.map((value, index) => (
            <Sheet
              key={index}
              variant="outlined"
              sx={{
                borderRadius: "md",
                boxShadow: "sm",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                p: 2,
                minWidth: 120,
              }}
            >
              <Radio
                id={value.title}
                value={value.title}
                checkedIcon={<CheckCircleRoundedIcon />}
                checked={target === value.title}
                onChange={() => {
                  setTarget(value.title);
                  connector.setTarget(value.title);
                  localStorage.setItem("target", value.title);
                }}
              />
              <FormLabel htmlFor={value.title}>
                <Typography fontFamily={"'M PLUS Rounded 1c', sans-serif"}>
                  {value.title}
                </Typography>
              </FormLabel>
              <img
                src={value.image}
                alt={value.title}
                style={{
                  aspectRatio: "1/1",
                  width: "10rem",
                  margin: "0 auto",
                }}
              />
            </Sheet>
          ))}
        </RadioGroup>
      </Box>

      {/* マイコン接続 */}

      <Box
        sx={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          margin: "1rem",
        }}
      >
        <Button onClick={connect}>
          接続
          <UsbIcon />
        </Button>
        <Button onClick={writeCode}>
          書き込み
          <FlagIcon />
        </Button>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            onChange={(ev) => {
              const checked = ev.currentTarget.checked;
              setAutoConnectMode(checked);
              localStorage.setItem("autoConnect", `${checked}`);

              if (checked) window.location.reload();
            }}
            checked={autoConnectMode}
          />
        }
        label="Auto connect"
        sx={{ color: "black" }}
      />

      <Log log={log} />
      <Input type="text" onChange={(e) => setCommand(e.target.value)} />
      <Input type="submit" onClick={() => send(command)} value="Send" />
    </Box>
  );
};

const CompileStatusCard = (props: { status: CompileStatus }) => (
  <Sheet
    variant="outlined"
    color="neutral"
    sx={{
      m: "1rem auto 0 auto",
      p: "0.5rem 1.5rem",
      width: "15rem",
      borderRadius: "sm",
      display: "flex",
      flexWrap: "wrap",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'M PLUS Rounded 1c', sans-serif",
    }}
  >
    {props.status.status === "idle" && (
      <>
        コンパイル待機中
        <CircularProgress size="1.5rem" sx={{ ml: "1rem" }} />
      </>
    )}
    {props.status.status === "compile" && (
      <>
        コンパイル中
        <CircularProgress size="1.5rem" sx={{ ml: "1rem" }} />
      </>
    )}
    {props.status.status === "success" && (
      <>
        コンパイル完了
        <CheckIcon color="success" />
      </>
    )}
    {props.status.status === "error" && (
      <>
        コンパイル失敗
        <ErrorOutlineIcon color="error" />
        <Box width="100%">
          <code>{props.status.error}</code>
        </Box>
      </>
    )}
  </Sheet>
);

const Log = (props: { log: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!autoScroll) return;

    scrollRef.current?.scroll({
      top: scrollRef.current.scrollHeight,
    });
  });

  useEffect(() => {
    const onScrollEnd = () => {
      const current = scrollRef.current;
      if (!current) return;

      const currentScroll = current.clientHeight + current.scrollTop;
      setAutoScroll(Math.abs(currentScroll - current.scrollHeight) < 1);
    };

    scrollRef.current?.addEventListener("scroll", onScrollEnd);
    return () => scrollRef.current?.removeEventListener("scroll", onScrollEnd);
  }, []);

  return (
    <Sheet
      variant="outlined"
      ref={scrollRef}
      sx={{
        m: "0 auto",
        px: "0.5rem",
        width: "85%",
        height: "20rem",
        textAlign: "left",
        overflowY: "auto",
        resize: "vertical",
      }}
    >
      {props.log.map((text, index) => (
        <div key={`log-${index}`}>
          <Ansi>{text}</Ansi>
        </div>
      ))}
    </Sheet>
  );
};

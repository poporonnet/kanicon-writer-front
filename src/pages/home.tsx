import { useCallback, useEffect, useState } from "react";
import {
  Box,
  FormLabel,
  Radio,
  radioClasses,
  RadioGroup,
  Sheet,
} from "@mui/joy";
import { Checkbox, FormControlLabel, Input, Typography } from "@mui/material";
import {
  Flag as FlagIcon,
  Usb as UsbIcon,
  Edit as EditIcon,
  UsbOff as UsbOffIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
} from "@mui/icons-material";

import { MrubyWriterConnector, Target } from "libs/mrubyWriterConnector";
import { isTarget } from "libs/utility";
import { useQuery } from "hooks/useQuery";
import RBoard from "/images/Rboard.png";
import ESP32 from "/images/ESP32.png";
import { Log } from "components/Log";
import { SourceCodeTab } from "components/SourceCodeTab";
import { ControlButton } from "components/ControlButton";
import { CompilerSelector } from "components/CompilerSelector";
import { Version, useVersions } from "hooks/useVersions";
import { useCompile } from "hooks/useCompile";
import { CompileStatusCard } from "components/CompileStatusCard";
import { useTranslation } from "react-i18next";

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

const defaultCompilerVersion = "3.2.0" satisfies Version;

export const Home = () => {
  const [t, i18n] = useTranslation("ns1");
  const query = useQuery();
  const id = query.get("id") ?? undefined;

  const targetItem = localStorage.getItem("target");
  const [target, setTarget] = useState<Target | undefined>(
    targetItem && isTarget(targetItem) ? targetItem : undefined
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
    })
  );
  const [command, setCommand] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [code, setCode] = useState<Uint8Array>();
  const [autoScroll, setAutoScroll] = useState(true);
  const [versions, getVersionsStatus] = useVersions();
  const [compileStatus, sourceCode, compile] = useCompile(id, setCode);

  const read = useCallback(async () => {
    const res = await connector.startListen();
    console.log(res);
    if (res.isFailure()) {
      alert(
        `${t("受信中にエラーが発生しました。")}\n${res.error}\ncause: ${res.error.cause}`
      );
    }
  }, [t, connector]);

  const connect = useCallback(async () => {
    const res = await connector.connect(
      async () => await navigator.serial.requestPort()
    );
    if (res.isFailure()) {
      alert(`${t("ポートを取得できませんでした。")}\n${res.error}`);
      console.log(res);
      return;
    }
    await read();
  }, [t, connector, read]);

  const disconnect = useCallback(async () => {
    const res = await connector.disconnect();
    if (res.isFailure()) {
      alert(
        `${t("切断中にエラーが発生しました。")}\n${res.error}\ncause: ${res.error.cause}`
      );
    }
  }, [t, connector]);

  const send = useCallback(
    async (text: string) => {
      const res = await connector.sendCommand(text, { force: true });
      console.log(res);
      if (res.isFailure()) {
        alert(
          `${t("送信中にエラーが発生しました。")}\n${res.error}\ncause: ${res.error.cause}`
        );
      }
    },
    [t, connector]
  );

  const writeCode = useCallback(async () => {
    if (!code) return;
    const res = await connector.writeCode(code);
    console.log(res);
    if (res.isFailure()) {
      alert(
        `${t("書き込み中にエラーが発生しました。")}\n${res.error}\ncause: ${res.error.cause}`
      );
    }
  }, [t, connector, code]);

  useEffect(() => {
    if (getVersionsStatus != "success") return;
    if (!versions.includes(defaultCompilerVersion)) return;

    compile(defaultCompilerVersion);
  }, [compile, versions, getVersionsStatus]);

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
  }, [autoConnectMode, connector, read]);

  useEffect(() => {
    console.log("called!");
    const locale = localStorage.getItem("locale");
    if (!locale) return;

    i18n.changeLanguage(locale);
  }, [i18n]);

  return (
    <>
      <Box
        sx={{
          mb: "0.5rem",
          display: "flex",
          width: "100%",
          minWidth: "30rem",
          maxWidth: "65rem",
          flexDirection: "row",
          flexGrow: "1",
          gap: "1rem",
        }}
      >
        <Box
          sx={{
            marginLeft: "2rem",
            width: "15rem",
            minWidth: "15rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <Sheet
            variant="outlined"
            sx={{
              pt: "1rem",
              pb: "0.5rem",
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "sm",
              borderColor:
                getVersionsStatus == "error" || compileStatus.status == "error"
                  ? "red"
                  : "lightgrey",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Box sx={{ width: "calc(100% - 2rem)" }}>
              <Typography
                fontFamily={"'M PLUS Rounded 1c', sans-serif"}
                variant="caption"
                color="GrayText"
              >
                {t("コンパイラバージョン")}
              </Typography>
              <CompilerSelector
                versions={versions.sort()}
                defaultVersion="3.2.0"
                disabled={getVersionsStatus != "success"}
                onChange={(version) => compile(version)}
                sx={{ width: "100%" }}
              />
            </Box>
            <CompileStatusCard
              status={
                getVersionsStatus == "error" ? "error" : compileStatus.status
              }
              error={compileStatus.error}
            />
          </Sheet>

          {/* マイコン選択 */}
          <Box
            sx={{
              width: "100%",
            }}
          >
            {!target && (
              <Typography variant="body1" color="red">
                {t("書き込みターゲットを選択してください。")}
              </Typography>
            )}
            <RadioGroup
              aria-label="platform"
              defaultValue="Website"
              overlay
              name="platform"
              sx={{
                width: "100%",
                gap: "1rem",
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
                    top: "-0.5rem",
                    right: "-0.5rem",
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
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "1rem",
                    p: "1rem",
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
                      width: "6rem",
                      margin: "0 auto",
                    }}
                  />
                </Sheet>
              ))}
            </RadioGroup>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(ev) => {
                    const checked = ev.currentTarget.checked;
                    setAutoScroll(checked);
                  }}
                  checked={autoScroll}
                />
              }
              label={t("自動スクロール")}
              sx={{ color: "black" }}
            />
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
              label={t("自動接続(Experimental)")}
              sx={{ color: "black" }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            marginRight: "2rem",
            minWidth: "25rem",
            display: "flex",
            flexDirection: "column",
            flexGrow: "1",
            gap: "1rem",
          }}
        >
          <Log log={log} autoScroll={autoScroll} />
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "right",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <ControlButton
              label={t("接続")}
              icon={<UsbIcon />}
              onClick={connect}
              disabled={!target || connector.isConnected}
            />
            <ControlButton
              label={t("書き込み")}
              icon={<EditIcon />}
              onClick={writeCode}
              disabled={
                compileStatus.status !== "success" || !connector.isWriteMode
              }
            />
            <ControlButton
              label={t("実行")}
              icon={<FlagIcon />}
              onClick={() => send("execute")}
              disabled={!connector.isWriteMode}
              color="success"
            />
            <ControlButton
              label={t("切断")}
              icon={<UsbOffIcon />}
              onClick={disconnect}
              disabled={!connector.isConnected}
              color="danger"
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "right",
            }}
          >
            <Input type="text" onChange={(e) => setCommand(e.target.value)} />
            <Input type="submit" onClick={() => send(command)} value="Send" />
          </Box>
        </Box>
      </Box>
      <SourceCodeTab sourceCode={sourceCode} />
    </>
  );
};

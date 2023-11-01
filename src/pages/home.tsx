import { useState } from "react";
import {
  Box,
  Button,
  FormLabel,
  Radio,
  radioClasses,
  RadioGroup,
  Sheet,
} from "@mui/joy";
import { Typography } from "@mui/material";
import "css/home.css";

import Rboard from "Rboard.png";
import ESP32 from "ESP32.png";
import { Flag, Usb } from "@mui/icons-material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const targets = [
  {
    title: "Rboard",
    image: Rboard,
  },
  {
    title: "ESP32",
    image: ESP32,
  },
];

export function Home() {
  const [step, setStep] = useState<number>(0);
  const [target, setTarget] = useState<string>("");
  let port;
  const [baud, setBaud] = useState<number>(115200);
  async function onConnectButtonClick() {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: baud });

      while (true) {
        const reader = port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            console.log(value);
          }
        } catch (error) {
          console.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function sendSerial() {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode("Hello World"));
    writer.releaseLock();
  }

  return (
    <div id={"home"}>
      <Box id={"home"}>
        <Typography
          variant="h4"
          component="div"
          color="black"
          fontFamily={"'M PLUS Rounded 1c', sans-serif"}
        >
          書き込みツール
        </Typography>

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
                  onChange={(e) => {
                    setTarget(e.target.value);
                    if (step === 0) setStep(1);
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

        <Box sx={{ display: "flex", justifyContent: "center", margin: "1rem" }}>
          <Button
            //disabled={step !== 2}
            onClick={() => {
              if (step === 2) setStep(3);
              onConnectButtonClick();
            }}
          >
            接続
            <Usb />
          </Button>
        </Box>

        {/* 書き込み中 */}
        <Box sx={{ display: "flex", justifyContent: "center", margin: "1rem" }}>
          <Button disabled={step !== 3} onClick={sendSerial}>
            書き込み
            <Flag />
          </Button>
        </Box>
        <Button onClick={() => setStep(0)}>リセット</Button>
      </Box>
    </div>
  );
}

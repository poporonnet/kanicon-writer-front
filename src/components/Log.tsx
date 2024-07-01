import { Sheet, Typography } from "@mui/joy";
import { useRef, useEffect } from "react";
import { ansiToJson } from "anser";

export const Log = (props: { log: string[]; autoScroll: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.autoScroll) return;

    scrollRef.current?.scroll({
      top: scrollRef.current.scrollHeight,
    });
  });

  return (
    <Sheet
      variant="outlined"
      ref={scrollRef}
      sx={{
        px: "0.5rem",
        boxSizing: "border-box",
        width: "100%",
        textAlign: "left",
        height: "20rem",
        minHeight: "12.5rem",
        minWidth: "inherit",
        maxWidth: "calc(min(100vw, 100dvw) - 20rem)",
        overflow: "auto",
        flexGrow: "1",
        whiteSpace: "nowrap",
        fontFamily: "'Noto Sans Mono', monospace",
      }}
    >
      {props.log.map((log) => (
        <>
          {ansiToJson(log, { remove_empty: true }).map((entry, index) => (
            <Typography
              sx={{
                color: entry.fg ? `rgb(${entry.fg})` : "inherit",
                backgroundColor: entry.bg ? `rgb(${entry.bg})` : "inherit",
                display: "inline",
                fontSize: "0.8rem",
                fontFamily: "inherit",
              }}
              key={`log-${index}`}
            >
              {entry.content}
            </Typography>
          ))}
          {log.length > 0 && <br />}
        </>
      ))}
    </Sheet>
  );
};

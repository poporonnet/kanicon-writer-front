import { AppBar, Box, Link, Toolbar } from "@mui/material";
import { Button, Sheet } from "@mui/joy";
import { GitHub, Translate } from "@mui/icons-material";
import icon from "/images/logo.png";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";

export const Header = () => {
  const [t, i18n] = useTranslation();
  const languages = useMemo(
    () =>
      i18n.languages
        .map((locale) => ({
          locale,
          name: t("languageName", { lng: locale }),
        }))
        .sort((lang1, lang2) => lang1.name.localeCompare(lang2.name)),
    [t, i18n]
  );
  const setLanguage = useCallback(
    (locale: string) => {
      i18n.changeLanguage(locale);
      localStorage.setItem("locale", locale);
    },
    [i18n]
  );

  return (
    <AppBar
      position="static"
      id={"header"}
      sx={{
        "--header-bg": "#ff3227",
        height: "4rem",
        backgroundColor: "var(--header-bg)",
        width: "100%",
        whiteSpace: "nowrap",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "22rem",
            height: "100%",
            gap: "0.4rem",
          }}
        >
          <img
            src={icon}
            alt={t("RubyCity松江のロゴ")}
            style={{
              margin: 0,
              padding: 0,
              height: "100%",
            }}
          />
          <Link
            href={import.meta.env.VITE_BASE_URL}
            variant="h4"
            underline="none"
            color="inherit"
            fontFamily="'M PLUS Rounded 1c', sans-serif"
            sx={{ ":hover": { color: "inherit" } }}
          >
            {t("書き込みツール")}
          </Link>
        </Box>
        <Box
          sx={{
            height: "100%",
            mr: "2rem",
            display: "flex",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <Link
            href={import.meta.env.VITE_REFERENCE_URL}
            variant="body1"
            underline="none"
            color="inherit"
            fontFamily="'M PLUS Rounded 1c', sans-serif"
            target="_blank"
            sx={{
              ":hover": { color: "inherit" },
            }}
          >
            {t("参考資料")}
          </Link>
          <Box
            sx={{
              display: "flex",
              position: "relative",
              "&:hover > div": {
                opacity: 1,
                visibility: "visible",
              },
            }}
          >
            <Translate fontSize="large" />
            <Sheet
              sx={{
                p: "1rem",
                m: "-1rem",
                width: "7rem",
                position: "absolute",
                top: "calc(1.5rem + 50%)",
                left: "calc(-3.5rem + 50%)",
                zIndex: "1",
                background: "transparent",
                transition: "all 100ms ease-in-out",
                opacity: 0,
                visibility: "hidden",
              }}
            >
              <Sheet
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  background: "white",
                  boxShadow: "lg",
                  borderRadius: "0.2rem",
                }}
              >
                {languages.map(({ locale, name }) => (
                  <Button
                    variant="plain"
                    onClick={() => setLanguage(locale)}
                    sx={{
                      color: "black",
                      transition: "all 100ms ease-in-out",
                      ":hover": {
                        background: "white",
                        color: "var(--header-bg)",
                      },
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </Sheet>
            </Sheet>
          </Box>
          <Link
            href={`https://github.com/${
              import.meta.env.VITE_WRITER_REPOSITORY_PATH
            }`}
            target="_blank"
            variant="body1"
            underline="none"
            color="inherit"
            sx={{
              ":hover": { color: "inherit" },
              display: "flex",
            }}
          >
            <GitHub fontSize="large" />
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

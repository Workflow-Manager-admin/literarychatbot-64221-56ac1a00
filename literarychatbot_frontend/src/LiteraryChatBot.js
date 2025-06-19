import React, { useState, useEffect, useRef } from "react";

/**
 * LiteraryChatBot Main Container - React Component
 * Features:
 *  - Sidebar for literary character selection
 *  - Chat window with message history and user input
 *  - Dynamic theme switching based on character
 *  - Uses OpenAI API for character voice responses
 *  - Optional text-to-speech (TTS) for bot replies
 *  - Stylized, responsive, modern UI (uses provided color scheme)
 */

// -- Character Profiles and Themes --
const CHARACTERS = [
  {
    id: "sherlock",
    display: "Sherlock Holmes",
    theme: {
      "--primary": "#4B0082",
      "--secondary": "#8A2BE2",
      "--accent": "#FFD700",
      "--background": "#f6f6fa",
      "--sidebarBg": "#4B0082",
      "--sidebarText": "#fff",
      "--chatBg": "#ffffff",
      "--inputBg": "#efefef",
      "--bubbleBot": "#8A2BE2",
      "--bubbleUser": "#FFD700",
      "--textBot": "#fff",
      "--textUser": "#333",
    },
    prompt: "You are Sherlock Holmes, the brilliant detective from Sir Arthur Conan Doyle's novels. Respond in his voice and style.",
    avatar: "🕵️‍♂️",
  },
  {
    id: "dracula",
    display: "Count Dracula",
    theme: {
      "--primary": "#250021",
      "--secondary": "#8A2BE2",
      "--accent": "#FFD700",
      "--background": "#1a0617",
      "--sidebarBg": "#250021",
      "--sidebarText": "#FFD700",
      "--chatBg": "#25122b",
      "--inputBg": "#180311",
      "--bubbleBot": "#8A2BE2",
      "--bubbleUser": "#FFD700",
      "--textBot": "#FFD700",
      "--textUser": "#fff",
    },
    prompt: "You are Count Dracula, the vampire from Bram Stoker's novel. Speak with a dark, formal tone and old-fashioned vocabulary.",
    avatar: "🦇",
  },
  {
    id: "elizabeth",
    display: "Elizabeth Bennet",
    theme: {
      "--primary": "#635d40",
      "--secondary": "#8A2BE2",
      "--accent": "#FFD700",
      "--background": "#fcf9f3",
      "--sidebarBg": "#635d40",
      "--sidebarText": "#fff",
      "--chatBg": "#fffdfa",
      "--inputBg": "#f4ede0",
      "--bubbleBot": "#8A2BE2",
      "--bubbleUser": "#FFD700",
      "--textBot": "#fff",
      "--textUser": "#3d361f",
    },
    prompt: "You are Elizabeth Bennet from Jane Austen's 'Pride and Prejudice'. Respond with wit, intelligence, and grace, set in Regency-era English.",
    avatar: "🌸",
  },
];

const DEFAULT_CHARACTER = CHARACTERS[0];

// -- Helper: Apply theme to document's :root --
function applyTheme(theme) {
  if (!theme) return;
  Object.keys(theme).forEach((key) => {
    document.documentElement.style.setProperty(key, theme[key]);
  });
}

// -- Main LiteraryChatBot Component --
// PUBLIC_INTERFACE
function LiteraryChatBot() {
  const [character, setCharacter] = useState(DEFAULT_CHARACTER);
  const [theme, setTheme] = useState(DEFAULT_CHARACTER.theme);
  const [chat, setChat] = useState([
    {
      sender: character.display,
      message: `Welcome, I am ${character.display}. Ask me anything!`,
      fromBot: true,
      characterId: character.id,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTTSEnabled] = useState(false);
  const chatEndRef = useRef(null);

  // Apply character's theme when it changes
  useEffect(() => {
    setTheme(character.theme);
    applyTheme(character.theme);
  }, [character]);

  // Scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // Speak last bot reply if TTS is enabled
  useEffect(() => {
    if (ttsEnabled && chat.length > 0) {
      const lastMsg = chat[chat.length - 1];
      if (lastMsg.fromBot) {
        speakTTS(lastMsg.message, character);
      }
    }
    // Only on bot reply
    // eslint-disable-next-line
  }, [chat, ttsEnabled, character]);

  // Handler: Character selection
  function handleSelectCharacter(char) {
    setCharacter(char);
    // Reset theme, clear chat, welcome for new character
    setChat([
      {
        sender: char.display,
        message: `Welcome, I am ${char.display}. ${getGreeting(char.id)}`,
        fromBot: true,
        characterId: char.id,
      },
    ]);
  }

  // Handler: Send user message
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = {
      sender: "You",
      message: input,
      fromBot: false,
      characterId: character.id,
    };
    setChat((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const botReply = await getBotReply(character, [...chat, userMessage]);
      setChat((prev) => [...prev, {
        sender: character.display,
        message: botReply,
        fromBot: true,
        characterId: character.id,
      }]);
    } catch (err) {
      setChat((prev) => [...prev, {
        sender: character.display,
        message: "Sorry, I could not reach my mind at the moment.",
        fromBot: true,
        characterId: character.id,
      }]);
    }
    setLoading(false);
  }

  // Handler: Toggle TTS
  function handleToggleTTS() {
    setTTSEnabled((prev) => !prev);
  }

  // Helper: TTS
  function speakTTS(text, char) {
    if (!window.speechSynthesis) return;
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = guessLang(char.id);
    utter.rate = 1;
    utter.pitch = char.id === "dracula" ? 0.7 : 1.1;
    utter.voice = chooseVoiceForCharacter(char.id);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  // Helper: Define language and voice for TTS by character
  function guessLang(charId) {
    // All English for now
    return "en-US";
  }
  function chooseVoiceForCharacter(charId) {
    // Try to pick a deeper voice for Dracula, default otherwise
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (charId === "dracula") {
      return voices.find((v) => v.name.match(/Zira|Brian|Richard|Male/)) || null;
    }
    if (charId === "elizabeth") {
      return voices.find((v) => v.name.match(/English|Female|Emma/)) || null;
    }
    // Sherlock (British, default male/female)
    return voices.find((v) => v.name.match(/English|UK|British/)) || null;
  }

  // Helper: Compose API message history for context
  function getMessageHistory(chatHistory, char) {
    // Merge user and bot exchanges as OpenAI expects:
    // {role: 'system'|'user'|'assistant', content: string}
    const messages = [
      { role: "system", content: char.prompt }
    ];
    chatHistory.forEach((msg) => {
      if (msg.fromBot) {
        messages.push({
          role: "assistant", content: msg.message
        });
      } else {
        messages.push({
          role: "user", content: msg.message
        });
      }
    });
    return messages;
  }

  // -- API Integration: OpenAI Chat --
  async function getBotReply(char, chatHistory) {
    // NOTE: For demo, expects REACT_APP_OPENAI_API_KEY in env or mock API. You need to provide your OpenAI API key!
    const OPENAI_API_KEY = (window?.env?.REACT_APP_OPENAI_API_KEY) || process.env.REACT_APP_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("Missing OpenAI API Key");
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: getMessageHistory(chatHistory, char),
        max_tokens: 350,
        temperature: char.id === "dracula" ? 0.85 : 0.7,
      }),
    });
    if (!resp.ok) throw new Error("OpenAI API error");
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || "[No reply received]";
  }

  // Helper: Greeting variants
  function getGreeting(charId) {
    if (charId === "dracula") return "You may ask me of the night, or your most fearful dreams.";
    if (charId === "elizabeth") return "Let us converse with civility. What would you like to discuss?";
    return "How may I assist you on your quest for knowledge?";
  }

  // -- UI Render --
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme["--background"] }}>
      {/* Sidebar for Character Selection */}
      <aside
        style={{
          background: theme["--sidebarBg"],
          color: theme["--sidebarText"],
          width: "230px",
          minWidth: "170px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "32px",
          paddingBottom: "32px",
          borderRight: `3px solid ${theme["--primary"]}`,
          minHeight: "100vh",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>
          LiteraryChatBot
        </div>
        <div style={{ marginBottom: 28, fontSize: 16, opacity: 0.85 }}>
          Select Character:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              className={char.id === character.id ? "active-character-btn" : "character-btn"}
              onClick={() => handleSelectCharacter(char)}
              style={{
                backgroundColor:
                  char.id === character.id ? theme["--accent"] : theme["--secondary"],
                color:
                  char.id === character.id ? theme["--sidebarText"] : "#fff",
                border: "none",
                borderRadius: "100px",
                padding: "12px 18px",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
                boxShadow:
                  char.id === character.id
                    ? "0 0 8px #FFD70099"
                    : "0 2px 3px rgba(0,0,0,0.09)",
                transition: "all 0.13s linear",
                outline: char.id === character.id ? `1.5px solid ${theme["--accent"]}` : "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22, marginRight: 4 }}>{char.avatar}</span>
              {char.display}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: "auto",
          fontSize: 13,
          color: theme["--sidebarText"],
          opacity: 0.7,
          textAlign: "center"
        }}>
          Themes auto-adjust by character 🎨
        </div>
        <div style={{
          marginTop: 18,
          textAlign: "center"
        }}>
          <button
            className="btn"
            style={{
              backgroundColor: ttsEnabled ? theme["--accent"] : theme["--secondary"],
              color: "#fff",
              padding: "8px 14px",
              fontSize: 15,
              borderRadius: "12px",
            }}
            onClick={handleToggleTTS}
            aria-pressed={ttsEnabled}
          >
            {ttsEnabled ? "🔊 TTS On" : "🔇 TTS Off"}
          </button>
        </div>
      </aside>

      {/* Chat Window */}
      <main
        style={{
          flex: 1,
          background: theme["--chatBg"],
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Titlebar */}
        <div
          style={{
            height: 68,
            borderBottom: `2px solid ${theme["--primary"]}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 40,
            paddingRight: 28,
            fontSize: 23,
            fontWeight: 600,
            letterSpacing: "1px",
            background: theme["--background"],
            color: theme["--primary"],
            zIndex: 2,
          }}
        >
          <span style={{ marginRight: 14, fontSize: 29 }}>
            {character.avatar}
          </span>
          {character.display}
        </div>
        {/* Chat Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "34px 0 25px 0",
            background: theme["--chatBg"],
            display: "flex",
            flexDirection: "column",
            gap: 14,
            justifyContent: "flex-end"
          }}
          id="chat-scroll-area"
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            maxWidth: "660px",
            margin: "0 auto"
          }}>
            {chat.map((msg, idx) => (
              <ChatBubble
                key={idx}
                message={msg.message}
                fromBot={msg.fromBot}
                avatar={msg.fromBot ? character.avatar : "🧑"}
                sender={msg.sender}
                theme={theme}
              />
            ))}
            {loading && (
              <ChatBubble
                fromBot
                sender={character.display}
                message="Typing..."
                avatar={character.avatar}
                theme={theme}
              />
            )}
            <div ref={chatEndRef}></div>
          </div>
        </div>
        {/* Input Area */}
        <form
          style={{
            background: theme["--inputBg"],
            display: "flex",
            alignItems: "center",
            borderTop: `2px solid ${theme["--primary"]}`,
            padding: "16px 30px",
            position: "sticky",
            bottom: 0,
            width: "100%",
            gap: 12,
          }}
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            value={input}
            placeholder="Type your message and press Enter..."
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: "11px 17px",
              border: "none",
              fontSize: 16,
              borderRadius: "14px",
              outline: "none",
              background: "#fff",
              color: "#1A1725",
              boxShadow: "0 2px 7px rgba(64,0,130,0.06)",
              minHeight: 40,
              transition: "box-shadow 0.13s",
              borderBottom: `2.5px solid ${theme["--secondary"]}`,
            }}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="btn"
            style={{
              backgroundColor: theme["--primary"],
              color: theme["--accent"],
              fontWeight: 700,
              fontSize: 19,
              padding: "9px 21px",
              borderRadius: "12px",
              border: "none",
              transition: "background 0.11s",
              outline: "none",
              opacity: input.trim() && !loading ? 1 : 0.5,
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            }}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function ChatBubble({ fromBot, sender, message, avatar, theme }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: fromBot ? "row" : "row-reverse",
        gap: 13,
        alignItems: "flex-start",
        marginLeft: fromBot ? 0 : "auto",
        marginRight: fromBot ? "auto" : 0,
        width: "100%",
        maxWidth: 600,
      }}
      aria-label={fromBot ? "reply from character" : "your message"}
    >
      <div
        style={{
          fontSize: 28,
          width: 35,
          textAlign: "center",
          marginTop: 2,
        }}
        title={sender}
      >
        {avatar}
      </div>
      <div
        style={{
          background: fromBot ? theme["--bubbleBot"] : theme["--bubbleUser"],
          color: fromBot ? theme["--textBot"] : theme["--textUser"],
          padding: "12px 17px",
          borderRadius: "14px",
          borderTopLeftRadius: fromBot ? "4px" : "14px",
          borderTopRightRadius: fromBot ? "14px" : "4px",
          boxShadow: "0 2px 6px rgba(41,0,130,0.06)",
          fontSize: 17,
          fontFamily: "inherit",
          maxWidth: fromBot ? 395 : 445,
          minWidth: 32,
          wordBreak: "break-word",
          position: "relative",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, opacity: 0.5 }}>
          {fromBot ? sender : "You"}
        </span>
        <br />
        {message}
      </div>
    </div>
  );
}

export default LiteraryChatBot;

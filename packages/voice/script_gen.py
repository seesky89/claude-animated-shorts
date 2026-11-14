#!/usr/bin/env python3
"""
AI Script Generator for Cartoon Shorts Engine.
Generates SCRIPT.md based on the proven 55-70s Style Bible formula:
Hook -> Setting -> Escalation -> Snap -> Deadpan double line -> Explanation -> Consequence -> Callback.
Supports Gemini, OpenAI, Anthropic, or Ollama.
"""
import os
import sys
import json
import argparse
import urllib.request
import urllib.error

STYLE_SYSTEM_PROMPT = """You are an elite historical/scientific shorts documentary writer for a viral 2D-in-3D animated cartoon channel.
Your task is to write a punchy, deadpan, humorous 55-70 second script (~200 to 240 English words, ~3.7 words/second) based on the provided true topic.

Follow this STRICT 8-part beat formula:
1. Hook: One line stating the absurd, surprising true fact directly. (e.g., "Seventy-four soldiers knocked down an iron bridge just by walking across it.")
2. Setting: The year, place, context and proud atmosphere.
3. Action / Escalation: 3 or 4 quick escalating beats, each building tension.
4. Snap: The exact moment of sudden physical failure or comedic disaster.
5. Deadpan Double Line: A sharp "Luckily... / Unluckily..." contrasting pair.
6. Explanation: One clear physical/scientific cause explained using a simple everyday analogy (like a kid on a swing).
7. Consequence: The real-world law or military/engineering rule it permanently created.
8. Callback Twist: A deadpan callback punchline connecting back to the hook.

Rules:
- Strictly English narration.
- Voice tone: steady, dry, deadpan, factual humor. No cheesy excitement or exclamation points.
- Never describe visual things the viewer can clearly see.
- Output ONLY the markdown format below, with no introductory banter.

Output Format:
# Topic: [Title]
<!-- Fact: [1-sentence factual summary] -->
<!-- Source: [Historical/scientific reference] -->

[Narrator text starts here, paragraph by paragraph, exactly matching the 8 beats.]
"""

def generate_with_gemini(topic, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": f"{STYLE_SYSTEM_PROMPT}\n\nTopic to write about:\n{topic}"}]}
        ],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000}
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

def generate_with_openai(topic, api_key):
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": STYLE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Topic to write about:\n{topic}"}
        ],
        "temperature": 0.7
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()

def generate_with_anthropic(topic, api_key):
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": 1000,
        "system": STYLE_SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": f"Topic to write about:\n{topic}"}
        ]
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    })
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["content"][0]["text"].strip()

def generate_with_ollama(topic, host="http://localhost:11434"):
    url = f"{host}/api/generate"
    payload = {
        "model": "llama3",
        "prompt": f"{STYLE_SYSTEM_PROMPT}\n\nTopic:\n{topic}",
        "stream": False
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["response"].strip()

def generate_script(topic, out_file=None):
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    ollama_host = os.environ.get("OLLAMA_HOST")

    script_content = None
    provider_name = ""

    if gemini_key:
        print("[AI] Using Google Gemini API...")
        provider_name = "Gemini"
        script_content = generate_with_gemini(topic, gemini_key)
    elif openai_key:
        print("[AI] Using OpenAI API (gpt-4o-mini)...")
        provider_name = "OpenAI"
        script_content = generate_with_openai(topic, openai_key)
    elif anthropic_key:
        print("[AI] Using Anthropic Claude API...")
        provider_name = "Claude"
        script_content = generate_with_anthropic(topic, anthropic_key)
    elif ollama_host:
        print("[AI] Using Local Ollama...")
        provider_name = "Ollama"
        script_content = generate_with_ollama(topic, ollama_host)
    else:
        # Informative fallback if no key is found in environment
        print("\n[NOTICE] No LLM API key detected (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY).")
        print("[AI] Generating structured story draft based on topic keywords...")
        provider_name = "Built-in Formula Generator"
        script_content = f"""# Topic: {topic.title()}
<!-- Fact: Surprising historical event regarding {topic} -->
<!-- Source: Historical archive analysis -->

Believe it or not, a strange set of circumstances once caused complete havoc involving {topic}.
It happened when people least expected it, during an ordinary day filled with standard confidence.
First, a subtle rhythm began that nobody paid attention to.
Then, the vibrations grew stronger with every passing second.
Suddenly, with a sharp crack, the entire structure completely gave way.
Luckily, most people walked away with just bruised egos and damp uniforms.
Unluckily, the proud builders had to explain how a simple natural frequency destroyed their masterpiece.
Think of it like a kid on a swing: push at the exact right moment, and even tiny forces add up to a disaster.
From that day onward, a strict new rule was written in ink to make sure nobody ever repeated that mistake again.
And as for the soldiers? They still had to walk the long way home.
"""

    if out_file:
        os.makedirs(os.path.dirname(os.path.abspath(out_file)), exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as fp:
            fp.write(script_content)
        print(f"[SUCCESS] Script generated via {provider_name} -> {out_file}")

    return script_content

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", required=True, help="Topic for the animated short")
    parser.add_argument("--out", help="Output SCRIPT.md path")
    args = parser.parse_args()
    content = generate_script(args.topic, args.out)
    if not args.out:
        print("\n" + content)

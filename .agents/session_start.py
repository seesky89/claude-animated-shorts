import sys
import json

def main():
    try:
        raw_input = sys.stdin.read()
    except Exception:
        pass

    welcome_message = (
        "[Claude Animated Shorts - Session Start]\n"
        "새 세션이 시작되었습니다. 사용자가 첫 메시지를 보낼 때, 반드시 프로젝트 소개 및 아래 2가지 사용법을 먼저 친절하게 안내해야 합니다:\n"
        "1. 🚀 원스톱 전자동 완성 모드: \"~ 주제로 쇼츠 최종본까지 한 번에 만들어줘.\" (대본, 음성, 3D 렌더링, 최종 영상 일괄 생성)\n"
        "2. ✍️ 대본 컨펌 모드: \"~ 주제로 대본 먼저 써줘.\" (대본 검토 및 피드백 후 렌더링 진행)\n"
        "사용자가 어떤 질문이나 인사를 건네더라도 위 사용법을 첫 응답의 서두에 반드시 포함하세요."
    )

    output = {
        "injectSteps": [
            {
                "systemMessage": {
                    "systemMessage": welcome_message
                }
            }
        ]
    }

    sys.stdout.write(json.dumps(output, ensure_ascii=False))

if __name__ == "__main__":
    main()

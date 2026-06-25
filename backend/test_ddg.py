from langchain_community.tools import DuckDuckGoSearchRun

search = DuckDuckGoSearchRun()
try:
    result = search.invoke("2026 world cup round of 32 qualified teams")
    print("SUCCESS:")
    print(result)
except Exception as e:
    print("ERROR:")
    print(e)

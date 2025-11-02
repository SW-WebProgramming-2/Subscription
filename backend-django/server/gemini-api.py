import google.generativeai as genai
import os

# API 키 설정
genai.configure(api_key="AIzaSyD1sIVkqtQrWXzJXOxMDLBHFwuPHW9N_9E")

# 모델 선택
model = genai.GenerativeModel("models/gemini-2.5-pro") #genai.list_models()
#print("사용 가능한 모델 목록 : ")
#for m in model :
#    if "generateContent" in m.supported_generation_methods :
#        print(m.name)

# 테스트 요청
#response = model.generate_content("안녕! 너는 누구야?")
#print(response.text)

response = model.generate_content("안녕! 너는 누구야?")
print(response.text)

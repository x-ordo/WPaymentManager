모든 API 공통 결과값
{"code":"400","message":"예외발생 다음에 이용해 주세요"} -> 서버오류
{"code":"401","message":"5초후 이용해 주세요"} -> 5초후 API호출 해야함
{"code":"402","message":"Connect정보 없음"} -> 로그인 다시 해야함
{"code":"404","message":"Not Found"} -> API없음
{"code":"500","message":"Database Error"}

로그인 http://127.0.0.1:33552/10100?id=master&pass=649005
{"code":"1","message":"성공","\_IN_NAME":"(주)홀딩스","\_MONEY":"100000","\_CLASS":"0","\_APROVALUE":"25","connectionid":"123","\_COMMISION_PERIN":"0.3","\_COMMISION_PEROUT":"0.3","\_COMMISION_IN":"1000","\_COMMISION_OUT":"1000"}
\_IN_NAME -> 입금자이름
\_MONEY -> 보유금액
\_CLASS -> 등급(0가맹점, 40지사, 60에이전시, 80운영자, 100마스터)
\_APROVALUE -> 사용가능일
\_COMMISION_PERIN -> 입금 %수수료
\_COMMISION_PEROUT -> 출금 %수수료
\_COMMISION_IN -> 입금 수수료
\_COMMISION_OUT -> 출금 수수료
connectionid -> API호출시 반드시 첨부해야함
{"code":"2","message":"사용 기간이 만료 되었습니다"}
{"code":"3","message":"ID, 비번이 일치하지 않음"}
{"code":"5","message":"사용 불가처리 상태 입니다"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

입금신청내역 127.0.0.1:33552/21000?id=ma1004&pass=a123456&sdate=2025-10-23 11:10:00&edate=2025-10-23 22:15:59&connectionid=123
{"code":"1","message":"성공","data":[{"_UNIQUEID":"1",...}]}
{"code":"2","message":"회원정보없음"}
{"code":"3","message":"정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

출금통지 불러오기 127.0.0.1:33552/30000?id=test8&pass=1234&sdate=2025-10-23 11:10:00&edate=2025-10-23 22:15:59&connectionid=123
{"code":"1","message":"성공","data":[{"_UNIQUEID":"1","_CREATE_DATETIME":"2025-10-23","_AFFILIATE_ID":"test","_NAME":"홍길동","_MONEY":"10000","_ORDERNUMBER":"123456","_BANKCODE":"080","_TEL":"010123456","_BANKNUMBER":"123456789","_USE":"True","_RETURNCODE":"0","_RETURNMSG":"123456"}]}
\_CREATE_DATETIME -> 통보일자
\_AFFILIATE_ID -> 가맹점명
\_MONEY -> 금액
\_ORDERNUMBER -> 주문번호
\_NAME -> 예금주
\_USE -> True처리, False미처리
{"code":"2","message":"회원정보없음"}
{"code":"3","message":"정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

입금통지 불러오기 127.0.0.1:33552/40000?id=test8&pass=1234&sdate=2025-10-23 11:10:00&edate=2025-10-23 22:15:59&connectionid=123
{"code":"1","message":"성공","data":[{"_UNIQUEID":"1","_CREATE_DATETIME":"2025-10-23","_SERVICE_ID":"M2591943","_ORDER_ID":"PGWAPI220251005102850.358","_TR_ID":"2025100510C1546844","_RESPONSE_CODE":"0000","_RESPONSE_MESSAGE":"성공","_AMOUNT":"10000","_IN_BANK_CODE":"089","_IN_BANK_USERNAME":"(주)상사","_STATE":"1","_AFFILIATE_ID":"test"}]}
\_CREATEDATE -> 통보일자
\_AFFILIATE_ID -> 가맹점명
\_SERVICE_ID -> 서비스ID
\_ORDER_ID -> 주문ID
\_TR_ID -> 드렌젝션ID
\_RESPONSE_CODE -> 상태코드
\_RESPONSE_MESSAGE -> 상태메시지
\_AMOUNT -> 금액
\_STATE -> 0미처리, 0아니면 처리
{"code":"2","message":"회원정보없음"}
{"code":"3","message":"정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

출금신청 접수하기 127.0.0.1:33552/50000?id=test8&pass=1234&money=10000&bankuser=홍길동&bankcode=089&bankname=카카오뱅크&banknumber=123456789&phone=01012344567&connectionid=123
{"code":"1","message":"성공"}
{"code":"2","message":"회원정보없음"}
{"code":"3","message":"1회 출금 최대 한도를 초과 하였습니다"}
{"code":"4","message":"예금주를 입력해 주세요"}
{"code":"5","message":"은행코드 선택 오류 입니다"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}
{"code":"7","message":"계좌번호를 입력해 주세요"}
{"code":"8","message":"1회 출금 최소 한도를 충족하지 못하였습니다"}
{"code":"9","message":"동일금액 출금신청은 30초후 해주세요"}

출금신청 리스트 불러오기 127.0.0.1:33552/51000?id=test8&pass=1234&sdate=2025-10-23 11:10:00&edate=2025-10-23 22:15:59&connectionid=123
{"code":"1","message":"성공","data":[{"_UNIQUEID":"1","_CREATE_DATETIME":"2025-10-23","_AFFILIATE_ID":"test2","_BANKCODE":"089","_BANKNAME":"카카오뱅크","_BANKNUMBER":"123456789","_BANKUSER":"홍길동","_MONEY":"10000","_RETURNCODE":"000","_RETURNMSG":"성공","_STATE":"1","_ADMIN_STATE":"0","_SHOP_STATE":"0","_MEMO":"메모","_VPN_BANKNAME":"","_VPN_BANKUSER":"","_VPNUSE":"False"}]}
\_CREATEDATE -> 신청일자
\_AFFILIATE_ID -> 가맹점명
\_MONEY -> 신청금액
\_STATE -> 상태(0미처리, 1처리, 2오류, 3취소)
\_RETURNCODE -> 응답코드
\_RETURNMSG -> 응답메시지
\_ADMIN_STATE -> 0(\_SHOP_STATE->0대기, 0아니면 가맹점승인), 0아니면 승인
{"code":"2","message":"회원정보없음"}
{"code":"3","message":"정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

출금신청 리스트 불러오기(이름or전화번호) 127.0.0.1:33552/51100?id=test8&pass=1234&bankuser=홍길동&count=30&connectionid=123
{"code":"1","message":"성공","data":[{"_CREATE_DATETIME":"2025-10-23","_BANKCODE":"089","_BANKNAME":"카카오뱅크","_BANKNUMBER":"123456789","_BANKUSER":"홍길동","_MONEY":"10000","_PHONE":"01012345678"}]}
{"code":"2","message":"회원정보없음"}
{"code":"3","message":"정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

가맹점 확인 127.0.0.1:33552/51400?id=test8&pass=1234&uniqueid=12345&connectionid=123
가맹점에서 출금 승인을 하는것임
{"code":"1","message":"성공"}
{"code":"2","message":"회원정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

데이타 취소 127.0.0.1:33552/51600?id=test8&pass=1234&uniqueid=12345&connectionid=123
가맹점에서 출금 승인한 것을 취소하는 것임
{"code":"1","message":"성공"}
{"code":"2","message":"회원정보없음"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

보유금액, 사용가능일요청 http://127.0.0.1:33552/90000?id=test8&pass=1234&connectionid=123
{"code":"1","message":"성공","\_MONEY":"100000","\_APROVALUE":"25","\_COMMISION_PERIN":"0.3","\_COMMISION_PEROUT":"0.3","\_COMMISION_IN":"1000","\_COMMISION_OUT":"1000"}
\_MONEY -> 보유금액
\_APROVALUE -> 사용가능일
\_COMMISION_PERIN -> 입금 %수수료
\_COMMISION_PEROUT -> 출금 %수수료
\_COMMISION_IN -> 입금 수수료
\_COMMISION_OUT -> 출금 수수료
{"code":"2","message":"사용 기간이 만료 되었습니다"}
{"code":"3","message":"회원정보없음"}
{"code":"5","message":"사용 불가처리 상태 입니다"}
{"code":"6","message":"현재 시스템 점검시간 입니다"}

출금신청 최소금액, 최대금액요청 http://127.0.0.1:33552/90100?id=ma1004&pass=a123456&connectionid=123
{"code":"1","message":"성공","\_MINSENDMONEY":"10000","\_MAXSENDMONEY":"1000000"}
\_MINSENDMONEY -> 최소금액
\_MAXSENDMONEY -> 최대금액
{"code":"6","message":"현재 시스템 점검시간 입니다"}

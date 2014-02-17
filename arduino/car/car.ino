#include <AFMotor.h>

char checksum(String str) {
  int sum = 0;
  for (int i = str.length() - 1; i >= 0; i -= 1) {
      sum += str[i];
  }
  sum = sum % 11;
  sum = (12 - sum) % 11;
  if (sum == 10) {
    sum = 'x';
  } else {
    sum += 48;  
  }
  return sum;
}
String getMsgFromSerial() {
  String line = "";
  if (Serial.available()) {
    line = Serial.readStringUntil('\n');
  }
  if (!line.startsWith("--msg-|-")) {
    return "";
  }
  String msg = line.substring(8);
//  Serial.println("1:" + msg);
  int flag = msg.length() - 8;
  if (msg.lastIndexOf("-|-") != flag) {
    return "";
  }
  
  String info = msg.substring(flag);
  msg = msg.substring(0, flag);
//  Serial.println("2:" + msg);
//  Serial.println("3,info:" + info);
  if (checksum(msg) != info[3]) {
    return "";
  }
  Serial.println("--msg-recive-ok-" + String((char)info[5]) + "--");
  return msg;
}

AF_DCMotor motor1(3);
AF_DCMotor motor2(4);

void setMotorSpeed(AF_DCMotor motor, String speedStr) {
//  Serial.println("setspeed:" + speedStr);
  if (speedStr[0] == '-') {
    motor.run(BACKWARD);
    speedStr = speedStr.substring(1);
  }
  else {
    motor.run(FORWARD);
  }
  uint8_t speed = speedStr.toInt();
  motor.setSpeed(speed);
  if (speed == 0) {
    motor.run(RELEASE);
  }
}

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps

//  irrecv.enableIRIn();

  // turn on motor
  motor1.setSpeed(0);
  motor2.setSpeed(0);

  motor1.run(RELEASE);
  motor2.run(RELEASE);
}

boolean checkMsg(String str) {
  if (str.indexOf("speed:") != 0) {
    return false;
  }
  str = str.substring(6);
//  Serial.println("substr:" + str);
  for(int i = 0; i < str.length(); i += 1) {
    if (str[i] != ',' && str[i] != '-' && (str[i] < '0' || str[i] > '9')) {
      return false;
    }
  }
  return true;
}

void loop() {
  String str = getMsgFromSerial();
  if (checkMsg(str)) {
//    Serial.println("checked:" + str);
    int flag = str.indexOf(",");
    setMotorSpeed(motor1, str.substring(6, flag));
    setMotorSpeed(motor2, str.substring(flag + 1));
  }
}

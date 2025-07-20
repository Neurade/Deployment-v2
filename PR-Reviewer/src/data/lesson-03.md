# Đáp án bài Git
## Bài 1: (file: lesson-3.txt)
Nội dung file:
- câu lệnh `git commit --amend`: thay đổi commit message của commit cuối cùng. Khi gõ xong vào giao diện dòng lệnh (vim) để thay đổi message.
- câu lệnh `git commit --amend -m"message"`: thay đổi commit message của commit cuối cùng, đổi luôn message mà không cần vào giao diện dòng lệnh (vim)
- `git restore --staged <file>`: đưa file ra khỏi staging area, không xóa file khỏi working directory.
- `git reset HEAD~1`: đưa commit cuối cùng từ repository về working directory.

## Bài 2: (file: lessson-3.txt)
a. Tạo 3 file: file1, file2, file3
Cả 3 file đều chưa được Git theo dõi (untracked files).

b. Chạy lệnh: git init
Khởi tạo một repository Git ở local. Cả 3 file đang nằm trong Working Directory.
- Working Directory: file1, file2, file3
- Staging Area: trống
- Repository: trống
- Commits: trống

c. Chạy lệnh: git commit -m "init project"
Không có gì xảy ra vì chưa có file nào được thêm vào Staging Area.
- Working Directory: file1, file2, file3
- Staging Area: trống
- Repository: trống
- Commits: trống

d. Chạy lệnh: git add file1
File file1 được đưa vào Staging Area
- Working Directory: file2, file3
- Staging Area: file1
- Repository: trống
- Commits: trống

e. Chạy lệnh: git commit -m "add file"
Tạo một commit mới với thông điệp "add file" và nội dung là file file1.
- Working Directory: file2, file3
- Staging Area: trống
- Repository: file1
- Commits:
    - commit 1: "add file" (chứa nội dung của file1)


f. Chạy lệnh: git add .
Thêm file2 và file3 vào Staging Area.
- Working Directory: trống
- Staging Area: file2, file3
- Repository: file1
- Commits:
    - commit 1: "add file" (chứa nội dung của file1)

g. Chạy lệnh: git restore --staged file2
Gỡ file file2 ra khỏi Staging Area. Lúc này chỉ còn file3 nằm trong Staging Area.
- Working Directory: file2
- Staging Area: file3
- Repository: file1
- Commits: 
    - commit 1: "add file" (chứa nội dung của file1)

h. Chạy lệnh: git commit -m "add all files"
Tạo một commit mới với thông điệp "add all files" và chỉ chứa file3.
- Working Directory: file2
- Staging Area: trống
- Repository: file1, file3
- Commits: 
    - commit 1: "add file" (chứa nội dung của file1)
    - commit 2: "add all files" (chứa nội dung của file3)

i. Chạy lệnh: git reset HEAD~1
Quay lại commit trước đó (add file). File file3 quay trở lại Working Directory và không còn nằm trong Staging Area.
- Working Directory: file2, file3
- Staging Area: trống
- Repository: file1
- Commits: 
    - commit 1: "add file" (chứa nội dung của file1)

## Bài 3: 
// **a. Chạy lệnh git init**
*   **Working directory:** trống
*   **Staging area:** trống
*   **Repository:** trống

// **b. Tạo file file1.txt, file2.txt, oops/file3.txt**
*   **Working directory:** `file1.txt`, `file2.txt`, `oops/file3.txt`
*   **Staging area:** trống
*   **Repository:** trống

// **c. Thêm file .gitignore (với nội dung là file1.txt và oops/)**
*   **Working directory:** `file1.txt`, `file2.txt`, `oops/file3.txt`, `.gitignore`
*   **Staging area:** trống
*   **Repository:** trống

// **d. Chạy lệnh: git add .**
*   **Working directory:** `file1.txt`, `file2.txt`, `oops/file3.txt`, `.gitignore`
*   **Staging area:** `file2.txt`, `.gitignore`
    *   *(Giải thích: `file1.txt` và `oops/` bị bỏ qua do có trong file `.gitignore`)*
*   **Repository:** trống

// **e. Chạy lệnh: git commit -m"init project"**
*   **Working directory:** `file1.txt`, `file2.txt`, `oops/file3.txt`, `.gitignore`
*   **Staging area:** trống
*   **Repository:** `file2.txt`, `.gitignore` (đã được lưu trong commit "init project")

# Đáp án bài Javascript
## Bài 1: (file: 01-object.js)
```javascript

// Bài 1
// Đề bài: Tạo một object car với thuộc tính make=”Toyota”, model=”Corolla”, và year=2021. Sau đó in ra năm sản xuất của xe.
// Đáp án:
const car = {
    make: "Toyota",
    model: "Corolla",
    year: 2021
};
console.log(car.year);

// Bài 2
// Đề bài: Tạo một object person có thuộc tính name, address (là một object lồng với các thuộc tính street, city, country). In ra tên đường của người này.
// Đáp án:
const person = {
    name: "Sun",
    address: {
        street: "1122 Nguyen Trai St",
        city: "Hanoi",
        country: "Vietnam"
    }
};
console.log(person.address.street);

// Bài 3
// Đề bài: Tạo một object student và truy cập đến điểm môn toán (math) sử dụng ngoặc vuông. Biết object student bao gồm 2 thuộc tính: name và grades. Trong đó grades là một object với 2 thuộc tính kiểu number: math và english.
// Đáp án:
const student = {
    name: "Sun Lee",
    grades: {
        math: 9.5,
        english: 8.5
    }
};
console.log(student.grades["math"]);

// Bài 4
// Đề bài: Tạo một object settings để quản lý cài đặt của ứng dụng với các thuộc tính như volume, brightness. Thay đổi volume và in ra object mới.
// Đáp án:
const settings = {
    volume: 80,
    brightness: 75,
};
console.log("before updating volume:", settings);
settings.volume == 100;
console.log("after updating volume:", settings);


// Bài 5
// Đề bài: Tạo một object bike và sau đó thêm thuộc tính color vào object đó.
// Đáp án:
const bike = {};
bike.color = "Black & Red";
console.log(bike);

// Bài 6
// Đề bài: Tạo một object employee với các thuộc tính: name, age và xóa thuộc tính age khỏi object này.
// Đáp án:
const employee = {
    name: "David Raya",
    age: 30
};
delete employee.age;
console.log(employee);

// Bài 7
// Đề bài: Một trường học có các lớp học và học sinh như sau:
// classA: An, Bình, Châu
// classB: Đào, Hương, Giang
// Khai báo tên biến: school
// Tên class là tên thuộc tính, giá trị của các thuộc tính này là một mảng chứa tên các học sinh.
// Đáp án:
const school = {
    classA: ["An", "Bình", "Châu"],
    classB: ["Đào", "Hương", "Giang"]
};
console.log(school);

```

## Bài 2: (file: 02-loop.js)
```javascript

// Bài 1
// Đề bài: Tính tổng từ 1 đến 100.
// Đáp án:
let sum = 0;
for (let i = 0; i <= 100; i++) {
    sum += i;
}
console.log(sum);

// Bài 2
// Đề bài: In bảng cửu chương từ 2 đến 9.
// Đáp án:
for (let i = 2; i <= 9; i++) {
    console.log(`The multiplication table of ${i}`);
    for (let j = 1; j <= 10; j++) {
        console.log(`${i}x${j} =`, i * j);
    }
}

// Bài 3
// Đề bài: Tạo một mảng chứa các số lẻ từ 1 đến 99.
// Đáp án:
let arr = [];
for (let i = 1; i <= 99; i++) {
    if (i % 2 !== 0) {
        arr.push(i);
    }
}
console.log(arr);

// Bài 4
// Đề bài: In ra 10 email dựa trên tên người dùng và số thứ tự (ví dụ: user1@example.com, user2@example.com, ..., user10@example.com).
// Đáp án:
const prefix = "user";
const suffix = "@example.com";
for (let i = 1; i <= 10; i++) {
    console.log(`${prefix}${i}${suffix}`);
}

// Bài 5
// Đề bài: Tính tổng doanh thu của 12 tháng trong năm dựa trên mảng doanh thu đã cho và in ra tổng doanh thu.
// Biết cấu trúc object của mảng doanh thu như sau: {"month": 2, "total": 100}
// Đáp án:
const revenues = [
    { "month": 1, "total": 20 },
    { "month": 2, "total": 100 },
    { "month": 3, "total": 40 },
    { "month": 4, "total": 160 },
    { "month": 5, "total": 400 },
    { "month": 6, "total": 1000 },
    { "month": 7, "total": 60 },
    { "month": 8, "total": 250 },
    { "month": 9, "total": 480 },
    { "month": 10, "total": 555 },
    { "month": 11, "total": 125 },
    { "month": 12, "total": 800 },
];
let totalRevenues = 0;
for (let i = 0; i < revenues.length; i++) {
    totalRevenues += revenues[i].total;
}
console.log("Total revenues: ", totalRevenues);

```

## Bài 3: (file: 03-function.js)
```javascript

// Bài 1
// Đề bài: Viết hàm multiply nhận 2 tham số a và b, in ra kết quả nhân của chúng. Gọi hàm với 2 cặp giá trị khác nhau.
// Đáp án:
function multiply(a, b) {
    console.log(`${a}x${b}=`, a * b);
}
multiply(5, 10);
multiply(2, 9);

// Bài 2
// Đề bài: Viết hàm findMin nhận 3 tham số a, b, c, trả về giá trị nhỏ nhất. Gọi hàm và in kết quả với 2 bộ số khác nhau.
// Đáp án:
function findMin(a, b, c) {
    let min = a;
    if (b < min) min = b;
    if (c < min) min = c;
    console.log(`Min is ${min}`);
    return min;
}
findMin(3000, 600, 400.12);
findMin(0, -2, 15);

// Bài 3
// Đề bài: Viết hàm getTopStudents nhận 2 tham số:
// - students: mảng các object, mỗi object chứa name (tên) và score (điểm).
// - threshold: ngưỡng điểm để được coi là "top" (số).
// Hàm trả về mảng mới chứa tên của những học sinh có điểm >= threshold.
// Gọi hàm với danh sách thực tế và in kết quả.
// Đáp án:
function getTopStudents(studentList, threshold) {
    let topStudents = [];
    studentList.forEach(student => {
        if (student.score >= threshold) {
            topStudents.push(student.name);
        }
    });
    console.log(topStudents);
    return topStudents;
}
const studentList = [
    { name: "Sun", score: 9 },
    { name: "Mark", score: 5 },
    { name: "Saliba", score: 7 },
    { name: "Garibel", score: 10 },
    { name: "Smith", score: 8.3 },
    { name: "Will", score: 2 },
];
getTopStudents(studentList, 7);

// Bài 4
// Đề bài: Viết hàm calculateInterest nhận 3 tham số:
// - principal: số tiền gửi ban đầu (số).
// - rate: lãi suất hàng năm (phần trăm, ví dụ 5 nghĩa là 5%).
// - years: số năm gửi.
// Hàm tính và trả về tổng số tiền (gốc + lãi) sau years năm, sử dụng công thức lãi đơn: total = principal + principal * rate * years / 100.
// Gọi hàm với ví dụ thực tế và in kết quả.
// Đáp án:
function calculateInterest(principal, rate, years) {
    const total = principal + (principal * rate * years) / 100;
    console.log(`The total after ${years} years:`, total);
    return total;
}
const interestInput = {
    principal: 1000000,
    rate: 3,
    years: 6
};
calculateInterest(interestInput.principal, interestInput.rate, interestInput.years);

```
/** Question data for Ai Là Triệu Phú game */
export interface Question {
    question: string;
    answers: [string, string, string, string];
    correct: 0 | 1 | 2 | 3; // index of correct answer
}

/** Prize ladder - 15 levels */
export const PRIZES = [
    '1.000.000 đ',
    '2.000.000 đ',
    '3.000.000 đ',
    '5.000.000 đ',
    '10.000.000 đ',   // Milestone 1 (question 5)
    '15.000.000 đ',
    '25.000.000 đ',
    '50.000.000 đ',
    '75.000.000 đ',
    '150.000.000 đ',  // Milestone 2 (question 10)
    '200.000.000 đ',
    '300.000.000 đ',
    '500.000.000 đ',
    '750.000.000 đ',
    '1.000.000.000 đ', // Milestone 3 (question 15) - 1 tỷ
];

/** Safe milestones - question indices (0-based) that are "safe" floors */
export const SAFE_MILESTONES = [4, 9, 14]; // Questions 5, 10, 15

/** 15 questions of increasing difficulty */
export const QUESTIONS: Question[] = [
    // Questions 1-5: Easy
    {
        question: 'Thủ đô của Việt Nam là thành phố nào?',
        answers: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Huế'],
        correct: 1,
    },
    {
        question: 'Con sông nào dài nhất Việt Nam?',
        answers: ['Sông Hồng', 'Sông Cửu Long', 'Sông Mekong', 'Sông Đà'],
        correct: 2,
    },
    {
        question: 'Việt Nam có bao nhiêu tỉnh thành?',
        answers: ['58', '61', '63', '65'],
        correct: 2,
    },
    {
        question: 'Đơn vị tiền tệ của Việt Nam là gì?',
        answers: ['Đô la', 'Đồng', 'Yên', 'Baht'],
        correct: 1,
    },
    {
        question: 'Vịnh nào của Việt Nam được UNESCO công nhận là Di sản Thiên nhiên Thế giới?',
        answers: ['Vịnh Nha Trang', 'Vịnh Đà Nẵng', 'Vịnh Hạ Long', 'Vịnh Cam Ranh'],
        correct: 2,
    },
    // Questions 6-10: Medium
    {
        question: 'Ai là người lãnh đạo Cách mạng tháng 8 năm 1945 của Việt Nam?',
        answers: ['Võ Nguyên Giáp', 'Hồ Chí Minh', 'Nguyễn Ái Quốc', 'Trường Chinh'],
        correct: 1,
    },
    {
        question: 'Năm nào Việt Nam chính thức thống nhất đất nước?',
        answers: ['1973', '1975', '1976', '1980'],
        correct: 2,
    },
    {
        question: 'Ngọn núi nào cao nhất Việt Nam?',
        answers: ['Phan Xi Păng', 'Ngọc Linh', 'Bạch Mã', 'Kon Ka Kinh'],
        correct: 0,
    },
    {
        question: 'Truyện Kiều là tác phẩm của nhà thơ nào?',
        answers: ['Hồ Xuân Hương', 'Nguyễn Đình Chiểu', 'Nguyễn Du', 'Tú Xương'],
        correct: 2,
    },
    {
        question: 'Ngày Giỗ Tổ Hùng Vương được tổ chức vào ngày bao nhiêu âm lịch?',
        answers: ['Mùng 9 tháng 3', 'Mùng 10 tháng 3', 'Mùng 10 tháng 4', 'Mùng 9 tháng 4'],
        correct: 1,
    },
    // Questions 11-15: Hard
    {
        question: 'Chiều dài bờ biển của Việt Nam là bao nhiêu km?',
        answers: ['2.900 km', '3.200 km', '3.444 km', '4.000 km'],
        correct: 2,
    },
    {
        question: 'Nhà khoa học người Việt Nam đầu tiên được đưa vào vũ trụ là ai?',
        answers: ['Phạm Tuân', 'Nguyễn Văn A', 'Bùi Thạc Chuyên', 'Đinh Tiên Hoàng'],
        correct: 0,
    },
    {
        question: 'Vua nào đã cho đúc Cửu Đỉnh đặt trước Thế Miếu (Huế)?',
        answers: ['Gia Long', 'Minh Mạng', 'Thiệu Trị', 'Tự Đức'],
        correct: 1,
    },
    {
        question: 'Mã bưu chính (zip code) của thành phố Hà Nội bắt đầu bằng số mấy?',
        answers: ['1', '7', '10', '100'],
        correct: 0,
    },
    {
        question: 'Việt Nam lần đầu tiên tổ chức SEA Games vào năm nào?',
        answers: ['2001', '2003', '2005', '2007'],
        correct: 1,
    },
];

import { collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Question, QUESTIONS as LOCAL_QUESTIONS } from '../config/questions';

export interface FirebaseQuestion extends Question {
    level: number;       // 1..15
    difficulty: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
}

/**
 * Load one random question per level (1..15) from Firestore.
 * Falls back to local QUESTIONS if Firestore fails.
 */
export async function loadQuestionsForGame(): Promise<Question[]> {
    try {
        const result: Question[] = [];

        for (let level = 1; level <= 15; level++) {
            const q = query(collection(db, 'questions'), where('level', '==', level));
            const snap = await getDocs(q);
            if (snap.empty) {
                // Fallback for this level
                result.push(LOCAL_QUESTIONS[level - 1]);
                continue;
            }
            // Pick a random one from available docs
            const docs = snap.docs;
            const picked = docs[Math.floor(Math.random() * docs.length)].data() as FirebaseQuestion;
            result.push({
                question: picked.question,
                answers: picked.answers,
                correct: picked.correct,
            });
        }

        return result;
    } catch (err) {
        console.warn('[questionService] Firestore error, using local fallback:', err);
        return [...LOCAL_QUESTIONS];
    }
}

// ─────────────────────────────────────────────────────
// Seed helper – call this ONCE from browser console:
//   import { seedQuestions } from './services/questionService';
//   seedQuestions();
// ─────────────────────────────────────────────────────
export async function seedQuestions() {
    const allQuestions: FirebaseQuestion[] = [
        // ── LEVEL 1 (difficulty 1 – very easy) ──
        { level: 1, difficulty: 1, question: 'Thủ đô của Việt Nam là thành phố nào?', answers: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Huế'], correct: 1 },
        { level: 1, difficulty: 1, question: 'Màu nào là màu của lá cây?', answers: ['Đỏ', 'Vàng', 'Xanh lá', 'Tím'], correct: 2 },
        { level: 1, difficulty: 1, question: '1 + 1 bằng bao nhiêu?', answers: ['1', '2', '3', '4'], correct: 1 },
        { level: 1, difficulty: 1, question: 'Con vật nào kêu "gâu gâu"?', answers: ['Mèo', 'Chó', 'Bò', 'Gà'], correct: 1 },

        // ── LEVEL 2 ──
        { level: 2, difficulty: 1, question: 'Đơn vị tiền tệ của Việt Nam là gì?', answers: ['Đô la', 'Đồng', 'Yên', 'Baht'], correct: 1 },
        { level: 2, difficulty: 1, question: 'Mặt trời mọc ở hướng nào?', answers: ['Tây', 'Nam', 'Đông', 'Bắc'], correct: 2 },
        { level: 2, difficulty: 1, question: 'Một năm có bao nhiêu tháng?', answers: ['10', '11', '12', '13'], correct: 2 },
        { level: 2, difficulty: 1, question: 'Nước Việt Nam nằm ở châu nào?', answers: ['Châu Phi', 'Châu Mỹ', 'Châu Âu', 'Châu Á'], correct: 3 },

        // ── LEVEL 3 ──
        { level: 3, difficulty: 1, question: 'Việt Nam có bao nhiêu tỉnh thành?', answers: ['58', '61', '63', '65'], correct: 2 },
        { level: 3, difficulty: 1, question: 'Con sông nào chảy qua Hà Nội?', answers: ['Sông Hương', 'Sông Hồng', 'Sông Mã', 'Sông Đà'], correct: 1 },
        { level: 3, difficulty: 1, question: 'Quốc kỳ Việt Nam có màu gì?', answers: ['Xanh và trắng', 'Đỏ và vàng', 'Xanh và vàng', 'Đỏ và trắng'], correct: 1 },
        { level: 3, difficulty: 1, question: 'Ngày Quốc khánh Việt Nam là ngày mấy?', answers: ['1/1', '30/4', '2/9', '19/8'], correct: 2 },

        // ── LEVEL 4 ──
        { level: 4, difficulty: 1, question: 'Vịnh nào được UNESCO công nhận là Di sản Thiên nhiên Thế giới?', answers: ['Vịnh Nha Trang', 'Vịnh Đà Nẵng', 'Vịnh Hạ Long', 'Vịnh Cam Ranh'], correct: 2 },
        { level: 4, difficulty: 1, question: 'Thành phố nào lớn nhất Việt Nam theo dân số?', answers: ['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Hồ Chí Minh'], correct: 3 },
        { level: 4, difficulty: 1, question: 'Ai là cha đẻ của dân tộc Việt Nam theo truyền thuyết?', answers: ['Lạc Long Quân', 'Hùng Vương', 'An Dương Vương', 'Đinh Tiên Hoàng'], correct: 0 },
        { level: 4, difficulty: 1, question: 'Ngọn núi nào cao nhất Việt Nam?', answers: ['Ngọc Linh', 'Phan Xi Păng', 'Bạch Mã', 'Kon Ka Kinh'], correct: 1 },

        // ── LEVEL 5 ──
        { level: 5, difficulty: 1, question: 'Năm 2003, SEA Games lần đầu tiên tổ chức tại Việt Nam, thành phố nào đăng cai?', answers: ['Hà Nội và TP.HCM', 'Hà Nội', 'TP.HCM', 'Đà Nẵng'], correct: 0 },
        { level: 5, difficulty: 1, question: 'Trống đồng Đông Sơn xuất hiện vào thời kỳ nào?', answers: ['Thời kỳ đồ đá', 'Thời kỳ đồ đồng', 'Thời kỳ đồ sắt', 'Thời phong kiến'], correct: 1 },
        { level: 5, difficulty: 2, question: 'Nhạc sĩ nào sáng tác bài "Tiến quân ca" – quốc ca Việt Nam?', answers: ['Phạm Duy', 'Văn Cao', 'Trịnh Công Sơn', 'Hoàng Việt'], correct: 1 },
        { level: 5, difficulty: 2, question: 'Vịt con xấu xí là truyện của tác giả nào?', answers: ['Grimm', 'Andersen', 'Perrault', 'La Fontaine'], correct: 1 },

        // ── LEVEL 6 (difficulty 2 – medium) ──
        { level: 6, difficulty: 2, question: 'Ai là người lãnh đạo Cách mạng tháng 8 năm 1945?', answers: ['Võ Nguyên Giáp', 'Hồ Chí Minh', 'Trường Chinh', 'Lê Duẩn'], correct: 1 },
        { level: 6, difficulty: 2, question: 'Trận Điện Biên Phủ kết thúc năm nào?', answers: ['1950', '1952', '1954', '1956'], correct: 2 },
        { level: 6, difficulty: 2, question: 'Áo dài Việt Nam có nguồn gốc từ triều đại nào?', answers: ['Triều Lý', 'Triều Trần', 'Triều Lê', 'Triều Nguyễn'], correct: 3 },
        { level: 6, difficulty: 2, question: 'Kinh đô cuối cùng của triều Nguyễn là thành phố nào?', answers: ['Thăng Long', 'Hội An', 'Huế', 'Đà Nẵng'], correct: 2 },

        // ── LEVEL 7 ──
        { level: 7, difficulty: 2, question: 'Việt Nam chính thức thống nhất đất nước năm nào?', answers: ['1973', '1975', '1976', '1980'], correct: 2 },
        { level: 7, difficulty: 2, question: 'Truyện Kiều là tác phẩm của nhà thơ nào?', answers: ['Hồ Xuân Hương', 'Nguyễn Đình Chiểu', 'Nguyễn Du', 'Tú Xương'], correct: 2 },
        { level: 7, difficulty: 2, question: 'Chiều dài bờ biển Việt Nam khoảng bao nhiêu km?', answers: ['2.900 km', '3.200 km', '3.444 km', '4.000 km'], correct: 2 },
        { level: 7, difficulty: 2, question: 'Người Việt Nam đầu tiên bay vào vũ trụ là ai?', answers: ['Phạm Tuân', 'Nguyễn Văn Lý', 'Bùi Thạc Chuyên', 'Ngô Bảo Châu'], correct: 0 },

        // ── LEVEL 8 ──
        { level: 8, difficulty: 2, question: 'Ngày Giỗ Tổ Hùng Vương là ngày bao nhiêu âm lịch?', answers: ['Mùng 9 tháng 3', 'Mùng 10 tháng 3', 'Mùng 10 tháng 4', 'Mùng 9 tháng 4'], correct: 1 },
        { level: 8, difficulty: 2, question: 'Hoa nào là quốc hoa của Việt Nam?', answers: ['Hoa sen', 'Hoa mai', 'Hoa đào', 'Hoa lan'], correct: 0 },
        { level: 8, difficulty: 2, question: 'Đồng bằng nào lớn nhất Việt Nam?', answers: ['Đồng bằng sông Hồng', 'Đồng bằng sông Cửu Long', 'Đồng bằng Duyên hải', 'Đồng bằng sông Mã'], correct: 1 },
        { level: 8, difficulty: 2, question: '"Nam quốc sơn hà" tương truyền là của tác giả nào?', answers: ['Nguyễn Trãi', 'Lý Thường Kiệt', 'Trần Nhân Tông', 'Trần Hưng Đạo'], correct: 1 },

        // ── LEVEL 9 ──
        { level: 9, difficulty: 2, question: 'Năm bao nhiêu Việt Nam gia nhập ASEAN?', answers: ['1990', '1993', '1995', '1997'], correct: 2 },
        { level: 9, difficulty: 2, question: 'Giải Fields Medal – giải thưởng toán học danh giá – người Việt Nam nào được nhận?', answers: ['Ngô Bảo Châu', 'Lê Tự Quốc Thắng', 'Hoàng Tụy', 'Nguyễn Hữu Việt Hưng'], correct: 0 },
        { level: 9, difficulty: 2, question: 'Cửa Lò thuộc tỉnh nào?', answers: ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình'], correct: 1 },
        { level: 9, difficulty: 2, question: 'Thác Bản Giốc nằm ở tỉnh nào?', answers: ['Cao Bằng', 'Lạng Sơn', 'Hà Giang', 'Lào Cai'], correct: 0 },

        // ── LEVEL 10 ──
        { level: 10, difficulty: 2, question: 'Mã ZIP (bưu chính) của Hà Nội bắt đầu bằng số mấy?', answers: ['1', '7', '10', '100'], correct: 0 },
        { level: 10, difficulty: 2, question: 'Năm bao nhiêu Việt Nam tổ chức SEA Games lần đầu tiên?', answers: ['2001', '2003', '2005', '2007'], correct: 1 },
        { level: 10, difficulty: 2, question: 'Làng nghề gốm Bát Tràng thuộc tỉnh/thành nào?', answers: ['Hà Nam', 'Thái Bình', 'Bắc Ninh', 'Hà Nội'], correct: 3 },
        { level: 10, difficulty: 2, question: 'Sông Mekong vào Việt Nam còn gọi là sông gì?', answers: ['Sông Hồng', 'Sông Cửu Long', 'Sông Đà', 'Sông Gianh'], correct: 1 },

        // ── LEVEL 11 (difficulty 3 – hard) ──
        { level: 11, difficulty: 3, question: 'Vua Minh Mạng cho đúc bộ Cửu Đỉnh đặt ở đâu?', answers: ['Điện Thái Hòa', 'Thế Miếu', 'Lăng Minh Mạng', 'Đại Nội'], correct: 1 },
        { level: 11, difficulty: 3, question: 'Trận Bạch Đằng năm 938 do ai chỉ huy?', answers: ['Lê Hoàn', 'Ngô Quyền', 'Trần Hưng Đạo', 'Đinh Bộ Lĩnh'], correct: 1 },
        { level: 11, difficulty: 3, question: 'Chữ Quốc ngữ được hoàn chỉnh và phổ biến bởi ai?', answers: ['Alexandre de Rhodes', 'Francisco de Pina', 'Pigneau de Béhaine', 'Jean-Louis Taberd'], correct: 0 },
        { level: 11, difficulty: 3, question: 'Triều đại nào tồn tại lâu nhất trong lịch sử phong kiến Việt Nam?', answers: ['Triều Lý', 'Triều Trần', 'Triều Lê Sơ', 'Triều Lê Trung Hưng'], correct: 3 },

        // ── LEVEL 12 ──
        { level: 12, difficulty: 3, question: 'Diện tích lãnh thổ đất liền của Việt Nam là bao nhiêu km²?', answers: ['295.000 km²', '310.000 km²', '330.967 km²', '350.000 km²'], correct: 2 },
        { level: 12, difficulty: 3, question: 'Cuộc khởi nghĩa nào đánh dấu sự bùng nổ đầu tiên chống Pháp năm 1858?', answers: ['Khởi nghĩa Trương Định', 'Cuộc kháng chiến Đà Nẵng', 'Khởi nghĩa Thái Nguyên', 'Phong trào Cần Vương'], correct: 1 },
        { level: 12, difficulty: 3, question: 'Nguyên tố hóa học nào có ký hiệu "Au"?', answers: ['Bạc', 'Vàng', 'Đồng', 'Sắt'], correct: 1 },
        { level: 12, difficulty: 3, question: 'Nhà soạn nhạc người Đức nào bị điếc nhưng vẫn sáng tác giao hưởng số 9?', answers: ['Mozart', 'Bach', 'Beethoven', 'Brahms'], correct: 2 },

        // ── LEVEL 13 ──
        { level: 13, difficulty: 3, question: 'Nhà máy thủy điện nào lớn nhất Việt Nam?', answers: ['Thủy điện Hoà Bình', 'Thủy điện Sơn La', 'Thủy điện Lai Châu', 'Thủy điện Yaly'], correct: 1 },
        { level: 13, difficulty: 3, question: 'Tốc độ ánh sáng trong chân không xấp xỉ bao nhiêu km/s?', answers: ['150.000 km/s', '300.000 km/s', '450.000 km/s', '600.000 km/s'], correct: 1 },
        { level: 13, difficulty: 3, question: 'Hàm số nào thỏa mãn: f\'(x) = f(x)?', answers: ['f(x) = x²', 'f(x) = eˣ', 'f(x) = ln(x)', 'f(x) = sin(x)'], correct: 1 },
        { level: 13, difficulty: 3, question: 'Bộ luật nào là bộ luật thành văn cổ nhất còn lưu giữ đầy đủ của Việt Nam?', answers: ['Hình thư', 'Quốc triều hình luật', 'Gia Long hội điển', 'Hoàng Việt luật lệ'], correct: 1 },

        // ── LEVEL 14 ──
        { level: 14, difficulty: 3, question: 'Thuật toán tìm kiếm nhị phân có độ phức tạp là gì?', answers: ['O(n)', 'O(n²)', 'O(log n)', 'O(n log n)'], correct: 2 },
        { level: 14, difficulty: 3, question: 'Tuổi thọ trung bình của tế bào hồng cầu người là bao nhiêu ngày?', answers: ['60 ngày', '90 ngày', '120 ngày', '180 ngày'], correct: 2 },
        { level: 14, difficulty: 3, question: 'Định lý Fermat cuối cùng được chứng minh năm nào?', answers: ['1985', '1990', '1993', '1995'], correct: 3 },
        { level: 14, difficulty: 3, question: 'Ngôn ngữ lập trình nào sử dụng JVM (Java Virtual Machine) nhưng không phải Java?', answers: ['TypeScript', 'Kotlin', 'Swift', 'Go'], correct: 1 },

        // ── LEVEL 15 (độ khó tối đa) ──
        { level: 15, difficulty: 3, question: 'Với 1 tỷ đồng, bạn đã sẵn sàng! Ai là người đầu tiên trên thế giới giành được 1 triệu đô trong chương trình WWTBAM bản gốc?', answers: ['John Carpenter', 'Judith Keppel', 'David Edwards', 'Robert Brydges'], correct: 0 },
        { level: 15, difficulty: 3, question: 'Bất đẳng thức Cauchy-Schwarz trong không gian Hilbert phát biểu rằng |⟨u,v⟩| ≤ ‖u‖·‖v‖. Đẳng thức xảy ra khi nào?', answers: ['u và v cùng chiều', 'u vuông góc v', 'u = 0 hoặc v = 0', 'u và v tuyến tính phụ thuộc'], correct: 3 },
        { level: 15, difficulty: 3, question: 'Vào năm 2023, quốc gia nào có GDP danh nghĩa lớn nhất thế giới?', answers: ['Trung Quốc', 'Mỹ', 'Đức', 'Nhật Bản'], correct: 1 },
        { level: 15, difficulty: 3, question: 'Số nguyên tố Mersenne thứ 50 được tìm ra vào cuối năm 2017 có dạng 2^p - 1. p bằng bao nhiêu?', answers: ['74.207.281', '77.232.917', '82.589.933', '86.243.197'], correct: 1 },
    ];

    console.log(`[seed] Uploading ${allQuestions.length} questions...`);
    for (const q of allQuestions) {
        await addDoc(collection(db, 'questions'), {
            ...q,
            createdAt: Timestamp.now(),
        });
    }
    console.log('[seed] Done!');
}

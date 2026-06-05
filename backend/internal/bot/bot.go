package bot

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"oltush/internal/config"
	"oltush/internal/db"
	"oltush/internal/models"
)

var rateLimiter = newRateLimiter()

type RateLimiter struct {
	mu       sync.Mutex
	lastSeen map[int64]time.Time
}

func newRateLimiter() *RateLimiter {
	return &RateLimiter{lastSeen: make(map[int64]time.Time)}
}

func (rl *RateLimiter) Allow(chatID int64) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	if last, ok := rl.lastSeen[chatID]; ok && now.Sub(last) < 2*time.Second {
		return false
	}
	rl.lastSeen[chatID] = now
	return true
}

type TelegramUpdate struct {
	UpdateID int64 `json:"update_id"`
	Message  struct {
		MessageID int64 `json:"message_id"`
		From      struct {
			ID        int64  `json:"id"`
			Username  string `json:"username"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
		} `json:"from"`
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text string `json:"text"`
	} `json:"message"`
	CallbackQuery struct {
		ID   string `json:"id"`
		From struct {
			ID int64 `json:"id"`
		} `json:"from"`
		Message struct {
			Chat struct {
				ID int64 `json:"id"`
			} `json:"chat"`
			MessageID int64 `json:"message_id"`
		} `json:"message"`
		Data string `json:"data"`
	} `json:"callback_query"`
}

func IsAdmin(userID int64, cfg *config.Config) bool {
	for _, id := range cfg.AdminTgIDs {
		if strings.TrimSpace(id) == fmt.Sprintf("%d", userID) {
			return true
		}
	}
	return false
}

func sendRequest(method string, payload map[string]interface{}, cfg *config.Config) error {
	if cfg.BotToken == "" {
		return fmt.Errorf("bot token not configured")
	}
	jsonPayload, _ := json.Marshal(payload)
	url := fmt.Sprintf("https://api.telegram.org/bot%s/%s", cfg.BotToken, method)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func SendMessage(chatID int64, text string, cfg *config.Config) error {
	return sendRequest("sendMessage", map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	}, cfg)
}

func SendMessageKeyboard(chatID int64, text string, keyboard map[string]interface{}, cfg *config.Config) error {
	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	}
	if keyboard != nil {
		payload["reply_markup"] = keyboard
	}
	return sendRequest("sendMessage", payload, cfg)
}

func AnswerCallbackQuery(callbackID string, text string, cfg *config.Config) error {
	return sendRequest("answerCallbackQuery", map[string]interface{}{
		"callback_query_id": callbackID,
		"text":              text,
	}, cfg)
}

func upsertCustomer(userID int64, username, firstName, lastName string) (*int, error) {
	var id int
	err := db.DB.QueryRow(
		`INSERT INTO customers (telegram_id, username, first_name, last_name, phone)
		 VALUES ($1, $2, $3, $4, '')
		 ON CONFLICT (telegram_id) DO UPDATE
		 SET username = EXCLUDED.username, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
		 RETURNING id`,
		userID, username, firstName, lastName,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func getCustomerIDByTg(userID int64) *int {
	var id int
	err := db.DB.QueryRow("SELECT id FROM customers WHERE telegram_id = $1", userID).Scan(&id)
	if err != nil {
		return nil
	}
	return &id
}

func getUserBookings(customerID int, statusFilter string) ([]models.Booking, error) {
	query := `SELECT id, item_id, start_date, end_date, status, total_price, guest_name, guest_phone
			  FROM bookings WHERE customer_id = $1`
	if statusFilter != "" {
		query += fmt.Sprintf(" AND status = '%s'", statusFilter)
	}
	query += " ORDER BY start_date"
	rows, err := db.DB.Query(query, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		var sd, ed time.Time
		if err := rows.Scan(&b.ID, &b.ItemID, &sd, &ed, &b.Status, &b.TotalPrice, &b.GuestName, &b.GuestPhone); err == nil {
			b.StartDate = sd.Format("2006-01-02")
			b.EndDate = ed.Format("2006-01-02")
			bookings = append(bookings, b)
		}
	}
	return bookings, nil
}

func getPrices() (string, error) {
	rows, err := db.DB.Query("SELECT name, type, price_per_night FROM items WHERE is_active = true ORDER BY type, name")
	if err != nil {
		return "", err
	}
	defer rows.Close()
	var msg strings.Builder
	msg.WriteString("<b>Прайс-лист</b>\n\n")
	for rows.Next() {
		var name, typ string
		var price float64
		if err := rows.Scan(&name, &typ, &price); err == nil {
			emoji := "🏠"
			if typ == "sauna" {
				emoji = "🔥"
			} else if typ == "tub" {
				emoji = "💧"
			}
			msg.WriteString(fmt.Sprintf("%s %s — <b>%.0f BYN</b>\n", emoji, name, price))
		}
	}
	return msg.String(), nil
}

func mainMenuKeyboard() map[string]interface{} {
	return map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{"text": "📅 Мои брони", "callback_data": "bookings"},
				{"text": "💰 Цены", "callback_data": "prices"},
			},
			{
				{"text": "🏕️ Забронировать", "callback_data": "book"},
				{"text": "❓ Помощь", "callback_data": "help"},
			},
		},
	}
}

func handleAssistant(chatID int64, text string, cfg *config.Config) {
	lower := strings.ToLower(text)

	switch {
	case containsAny(lower, []string{"привет", "здравств", "хай", "добрый день", "добрый вечер", "доброе утро"}):
		msg := "Привет! Я помощник базы отдыха <b>Олтуш</b>. 🏕️\n\n"
		msg += "Чем могу помочь? Выберите действие ниже:"
		SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

	case containsAny(lower, []string{"цена", "стоимость", "сколько", "прайс", "тариф", "деньги"}):
		prices, err := getPrices()
		if err != nil {
			SendMessage(chatID, "Не удалось загрузить прайс. Попробуйте позже.", cfg)
			return
		}
		SendMessageKeyboard(chatID, prices, mainMenuKeyboard(), cfg)

	case containsAny(lower, []string{"свобод", "когда", "дата", "занят", "есть ли", "доступ"}):
		msg := "Чтобы проверить свободные даты, откройте Mini App — там календарь с актуальной занятостью 📅"
		keyboard := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{{"text": "Открыть Mini App", "callback_data": "book"}},
				{{"text": "🔙 Назад", "callback_data": "menu"}},
			},
		}
		SendMessageKeyboard(chatID, msg, keyboard, cfg)

	case containsAny(lower, []string{"бронь", "забронировать", "домик", "баня", "купель", "заказать"}):
		msg := "Забронировать можно прямо в Mini App — выберите объект, даты и оформите бронь за пару минут 🏕️"
		keyboard := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{{"text": "🏕️ Забронировать", "callback_data": "book"}},
				{{"text": "🔙 Назад", "callback_data": "menu"}},
			},
		}
		SendMessageKeyboard(chatID, msg, keyboard, cfg)

	case containsAny(lower, []string{"контакт", "телефон", "адрес", "как добраться", "где находитесь", "карта"}):
		msg := "<b>Контакты Олтуш</b>\n\n"
		msg += "📍 База отдыха Олтуш, Брестская область\n"
		msg += "📞 +375 (XX) XXX-XX-XX\n"
		msg += "🗺 <a href=\"https://maps.app.goo.gl/5GgZMr1Kn5S1DESS8\">Открыть на карте</a>\n\n"
		msg += "Пишите в Telegram — отвечаем в течение часа!"
		SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

	case containsAny(lower, []string{"правила", "можно ли", "нельзя", "с животными", "с собакой", "с ребенком", "курить", "костер"}):
		msg := "<b>Основные правила</b>\n\n"
		msg += "• Заезд с 14:00, выезд до 12:00\n"
		msg += "• Курение только на улице\n"
		msg += "• Огонь только в мангалах\n"
		msg += "• Можно с питомцами по согласованию\n"
		msg += "• Возврат средств за 3 дня до заезда\n\n"
		msg += "Полные правила — в разделе Помощь → Правила в Mini App"
		SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

	case containsAny(lower, []string{"отмен", "снять бронь", "удалить бронь"}):
		msg := "Чтобы отменить бронь, используйте команду /cancel — я покажу список ваших броней."
		SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

	case containsAny(lower, []string{"оплат", "платеж", "картой", "перевод"}):
		msg := "Чтобы оплатить бронь, используйте команду /pay — я вышлю ссылку на оплату."
		SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

	default:
		msg := "Я не совсем понял вопрос, но готов помочь! 😊\n\n"
		msg += "Выберите, что вас интересует:"
		SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)
	}
}

func containsAny(s string, subs []string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func HandleWebhook(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if cfg.BotWebhookSecret != "" {
			secret := r.Header.Get("X-Telegram-Bot-Api-Secret-Token")
			if secret != cfg.BotWebhookSecret {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
		}

		var update TelegramUpdate
		if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		// ── Callback queries (inline buttons) ──
		if update.CallbackQuery.ID != "" {
			chatID := update.CallbackQuery.Message.Chat.ID
			msgID := update.CallbackQuery.Message.MessageID
			data := update.CallbackQuery.Data
			userID := update.CallbackQuery.From.ID

			AnswerCallbackQuery(update.CallbackQuery.ID, "", cfg)

			switch data {
			case "menu":
				SendMessageKeyboard(chatID, "Главное меню", mainMenuKeyboard(), cfg)
			case "book":
				msg := "Откройте Mini App, чтобы забронировать:"
				keyboard := map[string]interface{}{
					"inline_keyboard": [][]map[string]interface{}{
						{{"text": "🏕️ Открыть Mini App", "url": cfg.FrontendURL}},
					},
				}
				SendMessageKeyboard(chatID, msg, keyboard, cfg)
			case "bookings":
				cid := getCustomerIDByTg(userID)
				if cid == nil {
					SendMessage(chatID, "У вас пока нет бронирований.", cfg)
					break
				}
				bookings, _ := getUserBookings(*cid, "")
				if len(bookings) == 0 {
					SendMessage(chatID, "У вас пока нет бронирований.", cfg)
				} else {
					var msg strings.Builder
					msg.WriteString("<b>Ваши бронирования:</b>\n\n")
					for _, b := range bookings {
						status := "⏳ Ожидает"
						if b.Status == "confirmed" {
							status = "✅ Подтверждено"
						}
						msg.WriteString(fmt.Sprintf("#%d: %s — %s\nСтатус: %s\n\n", b.ID, b.StartDate, b.EndDate, status))
					}
					SendMessageKeyboard(chatID, msg.String(), mainMenuKeyboard(), cfg)
				}
			case "prices":
				prices, err := getPrices()
				if err != nil {
					SendMessage(chatID, "Не удалось загрузить прайс.", cfg)
				} else {
					SendMessageKeyboard(chatID, prices, mainMenuKeyboard(), cfg)
				}
			case "help":
				msg := "<b>Помощь</b>\n\n"
				msg += "<b>Команды:</b>\n"
				msg += "/start — Начать\n"
				msg += "/bookings — Мои брони\n"
				msg += "/cancel — Отменить бронь\n"
				msg += "/pay — Оплатить бронь\n"
				msg += "/help — Список команд\n\n"
				if IsAdmin(userID, cfg) {
					msg += "<b>Админ:</b>\n"
					msg += "/admin, /stats\n\n"
				}
				msg += "Просто напишите вопрос — я постараюсь помочь!"
				SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)
			case "stats":
				if !IsAdmin(userID, cfg) {
					SendMessage(chatID, "⛔ Нет доступа.", cfg)
					break
				}
				var totalBookings, confirmed, pending, manual int
				db.DB.QueryRow("SELECT COUNT(*) FROM bookings").Scan(&totalBookings)
				db.DB.QueryRow("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'").Scan(&confirmed)
				db.DB.QueryRow("SELECT COUNT(*) FROM bookings WHERE status = 'pending'").Scan(&pending)
				db.DB.QueryRow("SELECT COUNT(*) FROM bookings WHERE is_manual_override = true").Scan(&manual)
				msg := fmt.Sprintf("<b>Статистика бронирований</b>\n\nВсего: %d\nПодтверждено: %d\nОжидает: %d\nРучные: %d", totalBookings, confirmed, pending, manual)
				SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)
			default:
				if strings.HasPrefix(data, "cancel:") {
					var bookingID int
					fmt.Sscanf(data, "cancel:%d", &bookingID)
					_, err := db.DB.Exec("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1", bookingID)
					if err != nil {
						SendMessage(chatID, "Не удалось отменить бронь.", cfg)
					} else {
						msg := fmt.Sprintf("✅ Бронь <b>#%d</b> отменена.", bookingID)
						SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)
					}
				} else if strings.HasPrefix(data, "pay:") {
					var bookingID int
					fmt.Sscanf(data, "pay:%d", &bookingID)
					msg := fmt.Sprintf("Оплатить бронь <b>#%d</b> можно через Mini App:", bookingID)
					keyboard := map[string]interface{}{
						"inline_keyboard": [][]map[string]interface{}{
							{{"text": "💳 Перейти к оплате", "url": cfg.FrontendURL + "?pay=" + fmt.Sprintf("%d", bookingID)}},
							{{"text": "🔙 Назад", "callback_data": "menu"}},
						},
					}
					SendMessageKeyboard(chatID, msg, keyboard, cfg)
				}
			}

			// Edit original message to remove keyboard (optional UX improvement)
			_ = msgID
			// sendRequest("editMessageReplyMarkup", map[string]interface{}{
			// 	"chat_id": chatID, "message_id": msgID, "reply_markup": map[string]interface{}{},
			// }, cfg)

			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
			return
		}

		// ── Text messages ──
		if update.Message.Text == "" {
			w.WriteHeader(http.StatusOK)
			return
		}

		chatID := update.Message.Chat.ID
		userID := update.Message.From.ID
		text := update.Message.Text

		if !rateLimiter.Allow(chatID) {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Upsert customer on every message
		_, _ = upsertCustomer(userID, update.Message.From.Username, update.Message.From.FirstName, update.Message.From.LastName)
		customerID := getCustomerIDByTg(userID)

		switch text {
		case "/start":
			msg := fmt.Sprintf("Привет, <b>%s</b>! Добро пожаловать в <b>Олтуш</b>. 🏕️\n\n", update.Message.From.FirstName)
			msg += "Бронируйте домики, баню и купель прямо через Mini App."
			SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

		case "/help":
			msg := "<b>Помощь</b>\n\n"
			msg += "/start — Начать работу\n"
			msg += "/bookings — Мои бронирования\n"
			msg += "/cancel — Отменить бронь\n"
			msg += "/pay — Оплатить бронь\n"
			msg += "/help — Это сообщение\n"
			if IsAdmin(userID, cfg) {
				msg += "\n<b>Админ команды:</b>\n"
				msg += "/admin — Панель администратора\n"
				msg += "/stats — Статистика бронирований\n"
			}
			SendMessageKeyboard(chatID, msg, mainMenuKeyboard(), cfg)

		case "/bookings":
			if customerID == nil {
				SendMessageKeyboard(chatID, "У вас пока нет бронирований. Забронируйте через Mini App!", mainMenuKeyboard(), cfg)
				break
			}
			bookings, err := getUserBookings(*customerID, "")
			if err != nil {
				SendMessage(chatID, "Ошибка загрузки бронирований.", cfg)
				break
			}
			if len(bookings) == 0 {
				SendMessageKeyboard(chatID, "У вас пока нет бронирований.", mainMenuKeyboard(), cfg)
			} else {
				var msg strings.Builder
				msg.WriteString("<b>Ваши бронирования:</b>\n\n")
				for _, b := range bookings {
					status := "⏳ Ожидает"
					if b.Status == "confirmed" {
						status = "✅ Подтверждено"
					}
					msg.WriteString(fmt.Sprintf("#%d: %s — %s\nСтатус: %s\n\n", b.ID, b.StartDate, b.EndDate, status))
				}
				SendMessageKeyboard(chatID, msg.String(), mainMenuKeyboard(), cfg)
			}

		case "/cancel":
			if customerID == nil {
				SendMessageKeyboard(chatID, "У вас пока нет бронирований.", mainMenuKeyboard(), cfg)
				break
			}
			bookings, err := getUserBookings(*customerID, "")
			if err != nil || len(bookings) == 0 {
				SendMessageKeyboard(chatID, "У вас пока нет бронирований.", mainMenuKeyboard(), cfg)
				break
			}
			var rows [][]map[string]interface{}
			for _, b := range bookings {
				if b.Status == "cancelled" {
					continue
				}
				rows = append(rows, []map[string]interface{}{
					{"text": fmt.Sprintf("❌ Отменить #%d (%s)", b.ID, b.StartDate), "callback_data": fmt.Sprintf("cancel:%d", b.ID)},
				})
			}
			rows = append(rows, []map[string]interface{}{{"text": "🔙 Назад", "callback_data": "menu"}})
			SendMessageKeyboard(chatID, "<b>Выберите бронь для отмены:</b>", map[string]interface{}{"inline_keyboard": rows}, cfg)

		case "/pay":
			if customerID == nil {
				SendMessageKeyboard(chatID, "У вас пока нет бронирований.", mainMenuKeyboard(), cfg)
				break
			}
			bookings, err := getUserBookings(*customerID, "pending")
			if err != nil || len(bookings) == 0 {
				SendMessageKeyboard(chatID, "У вас нет броней, ожидающих оплаты.", mainMenuKeyboard(), cfg)
				break
			}
			var rows [][]map[string]interface{}
			for _, b := range bookings {
				rows = append(rows, []map[string]interface{}{
					{"text": fmt.Sprintf("💳 Оплатить #%d (%.0f BYN)", b.ID, b.TotalPrice), "callback_data": fmt.Sprintf("pay:%d", b.ID)},
				})
			}
			rows = append(rows, []map[string]interface{}{{"text": "🔙 Назад", "callback_data": "menu"}})
			SendMessageKeyboard(chatID, "<b>Брони, ожидающие оплаты:</b>", map[string]interface{}{"inline_keyboard": rows}, cfg)

		case "/admin":
			if !IsAdmin(userID, cfg) {
				SendMessage(chatID, "⛔ У вас нет доступа к админ-панели.", cfg)
				break
			}
			msg := "<b>Админ-панель Олтуш</b>\n\n"
			msg += "Управление бронированиями, объектами и клиентами."
			keyboard := map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{
						{"text": "🛠 Открыть админ-панель", "web_app": map[string]string{"url": cfg.FrontendURL + "/admin"}},
					},
					{
						{"text": "📊 Статистика", "callback_data": "stats"},
						{"text": "🔙 Назад", "callback_data": "menu"},
					},
				},
			}
			SendMessageKeyboard(chatID, msg, keyboard, cfg)

		case "/stats":
			if !IsAdmin(userID, cfg) {
				SendMessage(chatID, "⛔ Нет доступа.", cfg)
				break
			}
			var totalBookings, confirmed, pending, manual int
			db.DB.QueryRow("SELECT COUNT(*) FROM bookings").Scan(&totalBookings)
			db.DB.QueryRow("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'").Scan(&confirmed)
			db.DB.QueryRow("SELECT COUNT(*) FROM bookings WHERE status = 'pending'").Scan(&pending)
			db.DB.QueryRow("SELECT COUNT(*) FROM bookings WHERE is_manual_override = true").Scan(&manual)
			msg := fmt.Sprintf("<b>Статистика бронирований</b>\n\nВсего: %d\nПодтверждено: %d\nОжидает: %d\nРучные: %d", totalBookings, confirmed, pending, manual)
			SendMessage(chatID, msg, cfg)

		default:
			handleAssistant(chatID, text, cfg)
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}
}

func NotifyBookingCreated(bookingID int, cfg *config.Config) {
	if cfg.BotToken == "" {
		return
	}

	var itemName, guestName, guestPhone string
	var startDate, endDate time.Time
	var totalPrice float64
	var customerTgID int64
	err := db.DB.QueryRow(
		`SELECT i.name, b.start_date, b.end_date, b.total_price, COALESCE(b.guest_name,''), COALESCE(b.guest_phone,''), COALESCE(c.telegram_id, 0)
		 FROM bookings b
		 JOIN items i ON b.item_id = i.id
		 LEFT JOIN customers c ON b.customer_id = c.id
		 WHERE b.id = $1`,
		bookingID,
	).Scan(&itemName, &startDate, &endDate, &totalPrice, &guestName, &guestPhone, &customerTgID)

	if err != nil {
		slog.Error("NotifyBookingCreated: failed to load booking details", "booking_id", bookingID, "error", err)
	}

	// Notify admins
	var adminMsg string
	if err != nil {
		adminMsg = fmt.Sprintf("<b>Новое бронирование!</b>\n\nБронь #%d создана.", bookingID)
	} else {
		adminMsg = fmt.Sprintf(
			"<b>Новое бронирование #%d</b>\n\n🏠 %s\n📅 %s — %s\n💰 %.2f BYN\n👤 %s\n📞 %s",
			bookingID, itemName,
			startDate.Format("02.01.2006"), endDate.Format("02.01.2006"),
			totalPrice, guestName, guestPhone,
		)
	}
	for _, adminID := range cfg.AdminTgIDs {
		if adminID == "" {
			continue
		}
		var id int64
		fmt.Sscanf(adminID, "%d", &id)
		if id > 0 {
			if err := SendMessage(id, adminMsg, cfg); err != nil {
				slog.Error("NotifyBookingCreated: failed to send admin message", "admin_id", id, "error", err)
			}
		}
	}

	// Notify customer
	if customerTgID > 0 {
		payURL := cfg.FrontendURL
		if payURL != "" {
			payURL = payURL + "?pay=" + fmt.Sprintf("%d", bookingID)
		}
		customerMsg := fmt.Sprintf(
			"<b>Бронирование подтверждено!</b>\n\n🏠 %s\n📅 %s — %s\n💰 %.2f BYN\n\nСтатус: ⏳ Ожидает оплаты",
			itemName,
			startDate.Format("02.01.2006"), endDate.Format("02.01.2006"),
			totalPrice,
		)
		keyboard := mainMenuKeyboard()
		if payURL != "" {
			keyboard = map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{{"text": "💳 Оплатить", "url": payURL}},
					{{"text": "📅 Мои брони", "callback_data": "bookings"}, {"text": "🏕️ Забронировать", "callback_data": "book"}},
				},
			}
		}
		if err := SendMessageKeyboard(customerTgID, customerMsg, keyboard, cfg); err != nil {
			slog.Error("NotifyBookingCreated: failed to send customer message", "customer_tg_id", customerTgID, "error", err)
		}
	}
}

func NotifyPaymentReceived(bookingID int, amount float64, cfg *config.Config) {
	if cfg.BotToken == "" {
		return
	}
	msg := fmt.Sprintf("<b>Оплата получена!</b>\n\nБронь #%d\nСумма: %.2f BYN", bookingID, amount)
	for _, adminID := range cfg.AdminTgIDs {
		if adminID == "" {
			continue
		}
		var id int64
		fmt.Sscanf(adminID, "%d", &id)
		if id > 0 {
			if err := SendMessage(id, msg, cfg); err != nil {
				slog.Error("NotifyPaymentReceived: failed to send message", "admin_id", id, "error", err)
			}
		}
	}
}

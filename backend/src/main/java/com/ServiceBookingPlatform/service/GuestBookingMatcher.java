package com.ServiceBookingPlatform.service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Decides whether a booking made as a guest belongs to a customer account, from the phone and name typed
 * at checkout versus the account's profile. Neither is verified, which is why both must match.
 */
public final class GuestBookingMatcher {

    // Shorter than this, a trailing match is too likely to be a different number: require equality.
    private static final int MIN_DIGITS_FOR_COUNTRY_CODE_TOLERANCE = 8;

    private GuestBookingMatcher() {
    }

    public static String digitsOnly(String phone) {
        return phone == null ? "" : phone.replaceAll("\\D", "");
    }

    /** Same digits, or the same number written with and without a country code (39333123456 and 333123456). */
    public static boolean samePhone(String first, String second) {
        String a = digitsOnly(first);
        String b = digitsOnly(second);
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        if (a.equals(b)) {
            return true;
        }
        String shorter = a.length() <= b.length() ? a : b;
        String longer = shorter == a ? b : a;
        return shorter.length() >= MIN_DIGITS_FOR_COUNTRY_CODE_TOLERANCE && longer.endsWith(shorter);
    }

    /** Same words ignoring case, accents and extra spaces: "  ANNA  Bianchi " matches "Anna Bianchi". */
    public static boolean sameName(String first, String second) {
        String a = normalizeName(first);
        return !a.isEmpty() && a.equals(normalizeName(second));
    }

    /**
     * The name typed at checkout may be shorter than the profile name: "Anna" belongs to "Anna Bianchi". Every word
     * of the booking name must appear in the account name, in any order. The reverse does not hold, so a booking
     * for "Anna Bianchi" is not claimed by an account called just "Anna".
     */
    public static boolean nameCoveredBy(String bookingName, String accountName) {
        String booking = normalizeName(bookingName);
        if (booking.isEmpty()) {
            return false;
        }
        Set<String> accountWords = new HashSet<>(Arrays.asList(normalizeName(accountName).split(" ")));
        return Arrays.stream(booking.split(" ")).allMatch(accountWords::contains);
    }

    public static boolean matches(String bookingName, String bookingPhone, String accountName, String accountPhone) {
        return samePhone(bookingPhone, accountPhone) && nameCoveredBy(bookingName, accountName);
    }

    /** The tail of a phone used to narrow the database lookup before the exact rules above are applied. */
    public static String lookupSuffix(String phone) {
        String digits = digitsOnly(phone);
        return digits.length() > MIN_DIGITS_FOR_COUNTRY_CODE_TOLERANCE
                ? digits.substring(digits.length() - MIN_DIGITS_FOR_COUNTRY_CODE_TOLERANCE)
                : digits;
    }

    private static String normalizeName(String name) {
        if (name == null) {
            return "";
        }
        return Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim()
                .replaceAll("\\s+", " ");
    }
}

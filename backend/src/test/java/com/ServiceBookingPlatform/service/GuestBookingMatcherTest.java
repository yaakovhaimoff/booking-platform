package com.ServiceBookingPlatform.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class GuestBookingMatcherTest {

    @ParameterizedTest
    @CsvSource({
            "3331112222, 3331112222",
            "3331112222, +39 333 111 2222",
            "393331112222, 3331112222",
            "+39-333-111-2222, 393331112222",
    })
    void theSamePhoneWrittenDifferentlyMatches(String first, String second) {
        assertTrue(GuestBookingMatcher.samePhone(first, second));
        assertTrue(GuestBookingMatcher.samePhone(second, first), "matching must be symmetric");
    }

    @ParameterizedTest
    @CsvSource({
            "3331112222, 3331112223",
            "3331112222, 3331112",
            "123456, 1234567",
            "1234567, 11234567",
            "393331112222, 413331112222",
    })
    void differentPhonesDoNotMatch(String first, String second) {
        assertFalse(GuestBookingMatcher.samePhone(first, second));
    }

    @Test
    void shortNumbersNeedExactEqualityBecauseATrailingMatchIsTooLikelyAnotherNumber() {
        assertTrue(GuestBookingMatcher.samePhone("123456", "123456"));
        assertFalse(GuestBookingMatcher.samePhone("123456", "9123456"));
        assertFalse(GuestBookingMatcher.samePhone("1234567", "991234567"));
    }

    @Test
    void emptyOrMissingPhonesNeverMatch() {
        assertFalse(GuestBookingMatcher.samePhone(null, null));
        assertFalse(GuestBookingMatcher.samePhone("", ""));
        assertFalse(GuestBookingMatcher.samePhone("abc", "def"));
        assertFalse(GuestBookingMatcher.samePhone("3331112222", null));
    }

    @Test
    void namesMatchIgnoringCaseAccentsAndSpacing() {
        assertTrue(GuestBookingMatcher.sameName("Anna Bianchi", "anna bianchi"));
        assertTrue(GuestBookingMatcher.sameName("  ANNA   Bianchi ", "Anna Bianchi"));
        assertTrue(GuestBookingMatcher.sameName("Zoë Müller", "zoe muller"));
        assertTrue(GuestBookingMatcher.sameName("José", "Jose"));
    }

    @Test
    void differentOrPartialOrMissingNamesDoNotMatch() {
        assertFalse(GuestBookingMatcher.sameName("Anna Bianchi", "Anna"));
        assertFalse(GuestBookingMatcher.sameName("Anna Bianchi", "Anna Rossi"));
        assertFalse(GuestBookingMatcher.sameName("Anna Bianchi", "Bianchi Anna"));
        assertFalse(GuestBookingMatcher.sameName(null, null));
        assertFalse(GuestBookingMatcher.sameName("  ", "  "));
        assertFalse(GuestBookingMatcher.sameName("Anna", null));
    }

    @Test
    void aBookingMatchesOnlyWhenPhoneAndNameBothMatch() {
        assertTrue(GuestBookingMatcher.matches("Anna Bianchi", "3331112222", "anna bianchi", "393331112222"));
        assertFalse(GuestBookingMatcher.matches("Anna Bianchi", "3331112222", "Marta Rossi", "3331112222"),
                "same phone, different name");
        assertFalse(GuestBookingMatcher.matches("Anna Bianchi", "3331112222", "Anna Bianchi", "3339998888"),
                "same name, different phone");
    }

    @Test
    void lookupSuffixKeepsTheLastEightDigitsOrTheWholeShortNumber() {
        assertEquals("31112222", GuestBookingMatcher.lookupSuffix("+39 333 111 2222"));
        assertEquals("31112222", GuestBookingMatcher.lookupSuffix("3331112222"));
        assertEquals("12345678", GuestBookingMatcher.lookupSuffix("12345678"));
        assertEquals("123456", GuestBookingMatcher.lookupSuffix("123456"));
        assertEquals("", GuestBookingMatcher.lookupSuffix(null));
        assertEquals("", GuestBookingMatcher.lookupSuffix("none"));
    }

    @Test
    void digitsOnlyStripsEverythingElse() {
        assertEquals("393331112222", GuestBookingMatcher.digitsOnly("+39 (333) 111-2222"));
        assertEquals("", GuestBookingMatcher.digitsOnly(null));
    }
}

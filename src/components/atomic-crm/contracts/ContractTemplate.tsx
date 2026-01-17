
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: "#ffffff",
        fontFamily: "Helvetica",
        fontSize: 12,
        color: "#333",
    },
    header: {
        fontSize: 24,
        marginBottom: 30,
        fontWeight: "bold",
        textAlign: "center",
        color: "#111",
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    section: {
        marginBottom: 20,
        padding: 10,
        borderBottom: "1px solid #eee",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#555",
        textTransform: "uppercase",
    },
    row: {
        flexDirection: "row",
        marginBottom: 5,
    },
    label: {
        width: 120,
        fontWeight: "bold",
        color: "#777",
    },
    value: {
        flex: 1,
    },
    footer: {
        marginTop: 50,
        paddingTop: 20,
        borderTop: "1px solid #ccc",
    },
    signatureRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 40,
    },
    signatureBlock: {
        width: "45%",
    },
    signatureLine: {
        borderBottom: "1px solid #333",
        marginBottom: 5,
        height: 30,
    },
});

interface ContractData {
    id: string;
    contract_number?: string;
    contract_name: string;
    start_date?: string;
    expiry_date: string;
    amount?: number;
    status: string;
    companies?: {
        name: string;
        address?: string;
        city?: string;
        zipcode?: string;
        country?: string;
    };
}

export const ContractDocument = ({ data }: { data: ContractData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Service Agreement</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Client Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Company:</Text>
                    <Text style={styles.value}>{data.companies?.name || "N/A"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>
                        {[
                            data.companies?.address,
                            data.companies?.city,
                            data.companies?.zipcode,
                            data.companies?.country
                        ].filter(Boolean).join(", ") || "N/A"}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contract Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Contract Ref:</Text>
                    <Text style={styles.value}>{data.contract_number || data.id}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Service Plan:</Text>
                    <Text style={styles.value}>{data.contract_name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Start Date:</Text>
                    <Text style={styles.value}>
                        {data.start_date ? format(new Date(data.start_date), "PP") : "N/A"}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>End Date:</Text>
                    <Text style={styles.value}>
                        {data.expiry_date ? format(new Date(data.expiry_date), "PP") : "N/A"}
                    </Text>
                </View>
                {data.amount && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Annual Amount:</Text>
                        <Text style={styles.value}>
                            {new Intl.NumberFormat("en-GB", {
                                style: "currency",
                                currency: "GBP",
                            }).format(data.amount)}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.sectionTitle}>Authorization</Text>
                <Text>
                    By signing below, both parties agree to the terms and conditions of this service agreement.
                </Text>
                <View style={styles.signatureRow}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text>Signed for {data.companies?.name}</Text>
                        <Text style={{ fontSize: 10, color: "#777", marginTop: 5 }}>Date:</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text>Signed for Atomic CRM</Text>
                        <Text style={{ fontSize: 10, color: "#777", marginTop: 5 }}>Date:</Text>
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);

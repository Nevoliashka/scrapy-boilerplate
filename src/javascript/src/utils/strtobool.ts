export default function strtobool(str: string | undefined | null): boolean {
    if (!str) {
        return false;
    }
    switch (str.toLowerCase().trim()) {
        case 'true':
        case 'yes':
        case '1':
            return true;
        case 'false':
        case 'no':
        case '0':
            return false;
        default:
            return false;
    }
}

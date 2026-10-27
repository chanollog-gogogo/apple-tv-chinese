import Foundation
import JavaScriptCore
let args = CommandLine.arguments
if args.count != 3 { fatalError("Usage: test-native-jsc SOURCE_DIRECTORY PUBLIC_FIXTURES_JSON") }
let root = URL(fileURLWithPath: args[1])
func read(_ name: String) throws -> String { try String(contentsOf: root.appendingPathComponent(name), encoding: .utf8) }
let context = JSContext()!
var exceptionText: String? = nil
context.exceptionHandler = { _, exception in exceptionText = exception?.toString() ?? "JavaScriptCore exception" }
context.setObject(try read("apple-tv-full-subtitles.bundle.js"), forKeyedSubscript: "bundleSource" as NSString)
context.setObject(try read("subtitle-adapter.js"), forKeyedSubscript: "subtitleSource" as NSString)
context.setObject(try read("subtitle-mappings-v261013a.json"), forKeyedSubscript: "subtitleTablesJSON" as NSString)
let fixturesJSON = try String(contentsOfFile: args[2], encoding: .utf8)
context.setObject(fixturesJSON, forKeyedSubscript: "fixturesJSON" as NSString)
context.evaluateScript("var fixtures = JSON.parse(fixturesJSON);")
let result = context.evaluateScript(try read("test-local-profile.js"))
if let error = exceptionText { fputs(error + "\n", stderr); exit(1) }
print("Native macOS JavaScriptCore: " + (result?.toString() ?? "No result"))
